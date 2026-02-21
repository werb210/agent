import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { pool } from "../db";
import { calculateFundingScore, QualificationData } from "../engine/scoring";

type RouteAgentResult = {
  content: string;
  internal?: {
    sessionId: string;
    task: string;
    confidence?: number;
  };
};

const router = Router();

function normalizeCurrency(value: string) {
  const digitsOnly = value.replace(/[^\d.]/g, "");
  return Number(digitsOnly);
}

function extractQualificationData(message: string, existing: QualificationData): QualificationData {
  const qualificationData: QualificationData = { ...existing };
  const lowerMessage = message.toLowerCase();

  const fundingAmountMatch = message.match(/(?:\$|cad\s*)?([\d,]+(?:\.\d+)?)\s*(?:k|m)?\s*(?:funding|loan|line\s*of\s*credit|loc)?/i);
  if (fundingAmountMatch?.[1]) {
    const numericAmount = normalizeCurrency(fundingAmountMatch[1]);
    const multiplier = /\b\d+(?:\.\d+)?\s*m\b/i.test(fundingAmountMatch[0]) ? 1_000_000 : /\b\d+(?:\.\d+)?\s*k\b/i.test(fundingAmountMatch[0]) ? 1_000 : 1;
    if (!Number.isNaN(numericAmount) && numericAmount > 0) {
      qualificationData.fundingAmount = numericAmount * multiplier;
    }
  }

  const monthsMatch = lowerMessage.match(/(\d{1,3})\s*(?:months?|mos?)\s*(?:in\s*business)?/i);
  if (monthsMatch?.[1]) {
    qualificationData.monthsInBusiness = Number(monthsMatch[1]);
  }

  const yearsMatch = lowerMessage.match(/(\d{1,2})\s*(?:years?|yrs?)\s*(?:in\s*business)?/i);
  if (yearsMatch?.[1]) {
    qualificationData.monthsInBusiness = Number(yearsMatch[1]) * 12;
  }

  const revenueMatch = message.match(/(?:\$|cad\s*)?([\d,]+(?:\.\d+)?)\s*(k|m)?\s*(?:\/\s*month|monthly|per\s*month)?\s*(?:revenue|sales)?/i);
  if (revenueMatch?.[1]) {
    const numericRevenue = normalizeCurrency(revenueMatch[1]);
    const revenueMultiplier = revenueMatch[2]?.toLowerCase() === "m" ? 1_000_000 : revenueMatch[2]?.toLowerCase() === "k" ? 1_000 : 1;
    if (!Number.isNaN(numericRevenue) && numericRevenue > 0) {
      qualificationData.monthlyRevenue = numericRevenue * revenueMultiplier;
    }
  }

  if (/\bno\b.*\b(cra|tax)\b|\b(cra|tax)\b.*\bno\b|\bnone\b.*\b(cra|tax)\b/i.test(lowerMessage)) {
    qualificationData.craIssues = false;
  }

  if (/\b(yes|have|owe|outstanding|behind|issues?)\b.*\b(cra|tax)\b|\b(cra|tax)\b.*\b(issues?|owing|debt|arrears|problem)\b/i.test(lowerMessage)) {
    qualificationData.craIssues = true;
  }

  return qualificationData;
}

async function loadQualificationData(sessionId: string): Promise<QualificationData> {
  const result = await pool.query(
    "SELECT qualification_data FROM sessions WHERE session_id = $1 LIMIT 1",
    [sessionId]
  );

  return (result.rows[0]?.qualification_data ?? {}) as QualificationData;
}

function getOpenAIClient() {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
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
  confidence: number;
}> {
  const currentSessionId = await ensureSession(incomingSessionId, userPhone);
  const existingQualificationData = await loadQualificationData(currentSessionId);
  const qualificationData = extractQualificationData(message, existingQualificationData);
  const { score, tier } = calculateFundingScore(qualificationData);

  await pool.query(
    `UPDATE sessions
     SET qualification_data = $1, funding_score = $2, tier = $3
     WHERE session_id = $4`,
    [JSON.stringify(qualificationData), score, tier, currentSessionId]
  );

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are Maya, the AI funding assistant for Boreal Financial.

Your primary objective:
Convert inbound SMS leads into qualified funding applications or booked strategy calls.

Context:
Boreal specializes in Canadian business funding:
- Lines of Credit
- Term Loans
- Equipment Financing
- Working Capital
- Factoring

When someone says:
"I want to apply"
Assume business financing unless clarified otherwise.

When someone says:
"Line of credit"
Immediately move into qualification mode.

Qualification flow for LOC:
1. Ask how much funding they need.
2. Ask how long they’ve been in business.
3. Ask approximate monthly revenue.
4. Ask if they have outstanding CRA or tax issues.
5. Then offer to book a call.

Tone:
- Professional
- Direct
- Intelligent
- Not robotic
- No textbook explanations
- No definitions unless asked
- No generic financial advice

Never explain what a line of credit is unless explicitly asked.

Always guide conversation forward.

If user requests call:
Use the booking tool.

If user gives partial info:
Store context mentally and continue qualification.

You are not ChatGPT.
You are a revenue-generating funding assistant.
`
      },
      { role: "user", content: message }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "book_call",
          description: "Book a phone call",
          parameters: {
            type: "object",
            properties: {
              date: { type: "string" },
              time: { type: "string" }
            },
            required: ["date", "time"]
          }
        }
      }
    ],
    tool_choice: "auto"
  });

  const aiMessage = completion.choices[0].message;
  const confidence = 0.9;

  if (aiMessage.tool_calls?.length) {
    const toolCall = aiMessage.tool_calls[0];
    const args = JSON.parse(toolCall.function.arguments);

    await pool.query(
      `UPDATE sessions
       SET task = $1, action_data = $2, confidence = $3
       WHERE session_id = $4`,
      ["book_call", JSON.stringify(args), confidence, currentSessionId]
    );

    let reply = "Let’s discuss options and see what may work. When can you speak?";
    if (tier === "A") {
      reply = "You look like a strong candidate. Let’s lock in a quick approval call. When works?";
    } else if (tier === "B") {
      reply = "You may qualify. A quick review call will confirm options. When works?";
    }

    return {
      sessionId: currentSessionId,
      reply,
      action: "book_call",
      confidence
    };
  }

  await pool.query(
    `UPDATE sessions
     SET confidence = $1
     WHERE session_id = $2`,
    [confidence, currentSessionId]
  );

  return {
    sessionId: currentSessionId,
    reply: aiMessage.content,
    confidence
  };
}

router.post("/ai/execute", async (req, res) => {
  try {
    const { message, sessionId, userPhone } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message required" });
    }

    const result = await executeChat(String(message), sessionId, userPhone);

    return res.json({
      success: true,
      sessionId: result.sessionId,
      reply: result.reply,
      confidence: result.confidence,
      ...(result.action ? { action: result.action } : {})
    });
  } catch (err) {
    console.error("AI error:", err);
    return res.status(500).json({ error: "AI failure" });
  }
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
