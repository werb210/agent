import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { pool } from "../db";
import { loadFullClientContext } from "../core/mayaMemoryEngine";
import {
  findTopAvailableSlots,
  createCalendarEvent,
  confirmBookingSMS
} from "../services/bookingService";
import { calculateConfidence } from "../core/mayaConfidence";
import { resilientLLM } from "../infrastructure/mayaResilience";
import { handleStartupInquiry } from "../core/mayaStartupHandler";
import { captureStartupLead } from "../core/mayaStartupCapture";
import { checkStartupProductLaunch } from "../core/mayaStartupLaunchEngine";
import { auditStateTransition, validateStateTransition } from "../core/stateMachine";

type RouteAgentResult = {
  content: string;
  internal?: {
    sessionId: string;
    task: string;
    confidence?: number;
  };
};

const router = Router();


async function transitionSessionState(sessionId: string, nextState: "qualifying" | "qualified" | "booked") {
  const currentResult = await pool.query(
    `SELECT state FROM sessions WHERE session_id = $1 LIMIT 1`,
    [sessionId]
  );

  const currentState = (currentResult.rows[0]?.state ?? "new") as string;
  validateStateTransition(currentState, nextState);

  await pool.query(
    `UPDATE sessions
     SET state = $1
     WHERE session_id = $2`,
    [nextState, sessionId]
  );

  await auditStateTransition({
    sessionId,
    currentState,
    newState: nextState
  });
}

async function buildEnhancedPrompt(phone: string, userMessage: string): Promise<string> {
  const context = await loadFullClientContext(phone);

  return `
You are Maya, CB AI.
Context:
${JSON.stringify(context, null, 2)}

User says:
${userMessage}

Follow compliance rules:
- Never estimate approval
- Never explain underwriting logic
- Never negotiate
- Give ranges only
`;
}

// === STRUCTURED QUALIFICATION ENGINE ===

type QualificationFields =
  | "funding_amount"
  | "product_type"
  | "time_in_business"
  | "annual_revenue"
  | "industry";

const REQUIRED_FIELDS: QualificationFields[] = [
  "funding_amount",
  "product_type",
  "time_in_business",
  "annual_revenue",
  "industry"
];

function detectEscalation(text: string): boolean {
  const triggers = [
    "human",
    "representative",
    "agent",
    "call me",
    "talk to someone",
    "speak to someone"
  ];

  return triggers.some((t) => text.toLowerCase().includes(t));
}

function extractStructuredField(text: string): { field: QualificationFields; value: number | string } | null {
  const lower = text.toLowerCase();

  const amountMatch = text.match(/\$?([\d,]+(?:\.\d+)?)/);
  if (amountMatch) {
    return { field: "funding_amount", value: parseFloat(amountMatch[1].replace(/,/g, "")) };
  }

  if (lower.includes("line of credit")) return { field: "product_type", value: "line_of_credit" };
  if (lower.includes("term loan")) return { field: "product_type", value: "term_loan" };
  if (lower.includes("factoring")) return { field: "product_type", value: "factoring" };
  if (lower.includes("equipment")) return { field: "product_type", value: "equipment_finance" };

  const yearsMatch = text.match(/(\d+)\s*(years|year)/);
  if (yearsMatch) {
    return { field: "time_in_business", value: parseInt(yearsMatch[1], 10) };
  }

  if (lower.includes("revenue")) {
    const revenueMatch = text.match(/\$?([\d,]+(?:\.\d+)?)/);
    if (revenueMatch) {
      return { field: "annual_revenue", value: parseFloat(revenueMatch[1].replace(/,/g, "")) };
    }
  }

  if (lower.includes("industry") || lower.includes("we are in")) {
    return { field: "industry", value: text };
  }

  return null;
}

async function handleBooking(session: any, requestedISO: string) {
  const suggestions = await findTopAvailableSlots(requestedISO);

  if (!suggestions.length) {
    return "All advisors are currently booked. Please try another date.";
  }

  if (!session.pendingSlotSelection) {
    session.pendingSlotSelection = suggestions;
    return suggestions
      .map(
        (s: any, i: number) =>
          `${i + 1}. ${new Date(s.startISO).toLocaleString()}`
      )
      .join("\n");
  }

  const choiceIndex = parseInt(session.lastUserMessage) - 1;

  if (!suggestions[choiceIndex]) {
    return "Please select a valid option number.";
  }

  const chosen = suggestions[choiceIndex];

  await createCalendarEvent(
    chosen.staff.email,
    chosen.startISO,
    chosen.endISO,
    chosen.staff.timezone,
    session.user_email || "client@example.com"
  );

  await pool.query(
    `UPDATE sessions
     SET assigned_broker_id = $1,
         stage = 'booked'
     WHERE session_id = $2`,
    [chosen.staff.id, session.session_id]
  );

  await transitionSessionState(session.session_id, "booked");

  await pool.query(
    `UPDATE staff_calendar
     SET last_assigned_at = NOW()
     WHERE id = $1`,
    [chosen.staff.id]
  );

  await confirmBookingSMS(
    session.phone,
    chosen.staff.email,
    chosen.startISO
  );

  return `You're booked. Confirmation has been sent.`;
}

async function structuredQualificationFlow(
  session: { session_id: string; qualification_data: Record<string, unknown> | null; stage?: string; user_email?: string | null },
  userMessage: string
) {
  const data = session.qualification_data || {};

  if (session.stage === "escalated") {
    const requestedDate = new Date(userMessage);
    if (!Number.isNaN(requestedDate.getTime())) {
      return handleBooking(session, requestedDate.toISOString());
    }

    return "Please share your preferred call time in ISO format (for example: 2026-03-15T16:00:00.000Z).";
  }

  if (detectEscalation(userMessage)) {
    await pool.query(
      `UPDATE sessions
       SET escalation = 'requested', stage = 'escalated'
       WHERE session_id = $1`,
      [session.session_id]
    );

    return "Absolutely. I can book a strategy call for you. Please share your preferred date and time in ISO format (for example: 2026-03-15T16:00:00.000Z).";
  }

  const extracted = extractStructuredField(userMessage);
  if (extracted) {
    data[extracted.field] = extracted.value;
  }

  await pool.query(
    `UPDATE sessions SET qualification_data = $1 WHERE session_id = $2`,
    [data, session.session_id]
  );

  const missing = REQUIRED_FIELDS.filter((f) => !data[f]);

  if (missing.length === 0) {
    await pool.query(
      `UPDATE sessions
       SET stage = 'qualified', tier = 'warm'
       WHERE session_id = $1`,
      [session.session_id]
    );

    await transitionSessionState(session.session_id, "qualified");

    return "Thank you. Based on what you've shared, you're pre-qualified for funding options. Would you like to book a strategy call or proceed with a formal application?";
  }

  const nextField = missing[0];

  const questionMap: Record<QualificationFields, string> = {
    funding_amount: "How much funding are you seeking?",
    product_type: "What type of funding are you interested in? (Line of credit, term loan, equipment financing, etc.)",
    time_in_business: "How long has your business been operating?",
    annual_revenue: "What is your approximate annual revenue?",
    industry: "What industry is your business in?"
  };

  await pool.query(
    `UPDATE sessions SET stage = 'qualifying' WHERE session_id = $1`,
    [session.session_id]
  );

  await transitionSessionState(session.session_id, "qualifying");

  return questionMap[nextField];
}

async function ensureSession(sessionId?: string, userPhone?: string) {
  const resolvedSessionId = sessionId ?? uuidv4();

  const existing = await pool.query(
    "SELECT session_id FROM sessions WHERE session_id = $1 LIMIT 1",
    [resolvedSessionId]
  );

  if (existing.rowCount === 0) {
    await pool.query(
      `INSERT INTO sessions (session_id, task, status, memo, action_data, confidence, user_phone)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [resolvedSessionId, "conversation", "active", JSON.stringify([]), null, null, userPhone ?? null]
    );
  }

  return resolvedSessionId;
}

export async function executeChat(message: string, incomingSessionId?: string, userPhone?: string): Promise<{
  sessionId: string;
  reply: string | null;
  action?: "book_call";
  startupFlow?: "available" | "not_available";
  confidence: number;
}> {
  const currentSessionId = await ensureSession(incomingSessionId, userPhone);
  const sessionResult = await pool.query(
    `SELECT session_id, qualification_data, stage, user_email
     FROM sessions
     WHERE session_id = $1
     LIMIT 1`,
    [currentSessionId]
  );

  const session = sessionResult.rows[0] as {
    session_id: string;
    qualification_data: Record<string, unknown> | null;
    stage?: string;
    user_email?: string | null;
  };

  if (message.toLowerCase().includes("startup")) {
    const result = await handleStartupInquiry(message);

    return {
      sessionId: currentSessionId,
      reply: result.reply,
      startupFlow: result.status,
      confidence: 0.95
    };
  }

  const response = await structuredQualificationFlow(session, message);
  const confidence = 0.9;

  await pool.query(
    `UPDATE sessions
     SET confidence = $1
     WHERE session_id = $2`,
    [confidence, currentSessionId]
  );

  return {
    sessionId: currentSessionId,
    reply: response,
    confidence
  };
}

router.post("/ai/execute", async (req, res) => {
  try {
    const { message, sessionId, userPhone } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const normalizedMessage = String(message);
    const result = await executeChat(normalizedMessage, sessionId, userPhone);

    return res.json({
      success: true,
      sessionId: result.sessionId,
      reply: result.reply,
      confidence: result.confidence,
      ...(result.startupFlow ? { startup_flow: result.startupFlow } : {}),
      ...(result.action ? { action: result.action } : {})
    });
  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).json({ error: "AI failure" });
  }
});

router.post("/maya/client", async (req, res) => {
  try {
    const { phone, message } = req.body as { phone?: string; message?: string };

    if (!phone || !message) {
      return res.status(400).json({ error: "phone and message are required" });
    }

    const prompt = await buildEnhancedPrompt(phone, message);
    const result = await resilientLLM("analysis", prompt);

    return res.json({
      reply: result.output,
      confidence: calculateConfidence(result.output),
      model: result.model
    });
  } catch (error) {
    console.error("Maya client endpoint error:", error);
    return res.status(500).json({ error: "Unable to process Maya client request" });
  }
});


router.post("/maya/startup-capture", async (req, res) => {
  try {
    const { name, email, phone } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
    };

    if (!name || !email || !phone) {
      return res.status(400).json({ error: "name, email, and phone are required" });
    }

    const result = await captureStartupLead({ name, email, phone });

    return res.json(result);
  } catch (error) {
    console.error("Startup capture endpoint error:", error);
    return res.status(500).json({ error: "Unable to capture startup lead" });
  }
});

router.post("/maya/admin/force-startup-check", async (_req, res) => {
  await checkStartupProductLaunch();
  res.json({ status: "checked" });
});

export async function routeAgent(task: string, payload: any, sessionId?: string): Promise<RouteAgentResult> {
  if (task !== "chat") {
    throw new Error("Invalid task");
  }

  const message = String(payload?.message ?? payload ?? "").trim();
  if (!message) {
    throw new Error("message is required");
  }

  const result = await executeChat(message, sessionId ?? payload?.userId, payload?.userPhone);

  return {
    content: result.reply ?? "I can help with that.",
    internal: {
      sessionId: result.sessionId,
      task: result.action ?? "conversation",
      confidence: result.confidence
    }
  };
}

export default router;
