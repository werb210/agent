import { Router, Request, Response } from "express";
import crypto from "crypto";
import { pool } from "../db";
import { createChatCompletion } from "../services/openaiService";
import {
  enforceBusinessRules,
  checkAvailability,
  suggestNextAvailableSlot,
  createCalendarEvent
} from "../services/calendarService";
import { sendSMS } from "../services/twilioService";
import { appendMemory, getMemory } from "../services/memoryService";

type RouteAgentResult = {
  content: string;
  internal?: {
    sessionId: string;
    task: string;
    confidence?: number;
  };
};

const router = Router();

async function ensureSession(sessionId: string): Promise<void> {
  await pool.query(
    `INSERT INTO sessions (session_id, task, data, memo, tier)
     VALUES ($1, $2, $3, $4, $5)`,
    [sessionId, "conversation", {}, null, null]
  );
}

export async function executeChat(message: string, incomingSessionId?: string): Promise<{
  sessionId: string;
  reply: string | null;
  action?: "book_call";
  confidence: number;
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const sessionId = incomingSessionId ?? crypto.randomUUID();

  if (!incomingSessionId) {
    await ensureSession(sessionId);
  }

  const priorMemory = await getMemory(sessionId);
  const { message: aiMessage, confidence } = await createChatCompletion(message, priorMemory);
  const msg = aiMessage;

  if (msg?.tool_calls && msg.tool_calls.length > 0) {
    const toolCall = msg.tool_calls[0];

    if (toolCall.function.name === "book_call") {
      const args = JSON.parse(toolCall.function.arguments) as { startISO: string };
      const validation = enforceBusinessRules(args.startISO);

      if (!validation.valid) {
        const invalidReply =
          "That time is outside business hours or invalid. Please choose a weekday between 9am and 5pm.";
        await appendMemory(sessionId, message, invalidReply);

        return {
          sessionId,
          reply: invalidReply,
          confidence
        };
      }

      const available = await checkAvailability(validation.startISO!, validation.endISO!);

      if (!available) {
        const suggestion = await suggestNextAvailableSlot(validation.startISO!);

        if (!suggestion) {
          const unavailableReply = "That time is unavailable and no alternative slots were found today.";
          await appendMemory(sessionId, message, unavailableReply);

          return {
            sessionId,
            reply: unavailableReply,
            confidence
          };
        }

        const suggestedReply = `That time is booked. Next available slot is ${suggestion.startISO}. Would you like me to confirm it?`;
        await appendMemory(sessionId, message, suggestedReply);

        return {
          sessionId,
          reply: suggestedReply,
          confidence
        };
      }

      await createCalendarEvent(validation.startISO!, validation.endISO!);

      if (incomingSessionId && /^\+?[1-9]\d{7,14}$/.test(incomingSessionId)) {
        await sendSMS(incomingSessionId, `Confirmed: ${validation.startISO}`);
      }

      const memo = `Booking for ${validation.startISO}`;
      const bookingReply = `Your call has been scheduled for ${validation.startISO}.`;

      await pool.query(
        `UPDATE sessions
         SET task = $1, memo = $2
         WHERE session_id = $3`,
        ["book_call", memo, sessionId]
      );

      await appendMemory(sessionId, message, bookingReply);

      return {
        sessionId,
        reply: bookingReply,
        action: "book_call",
        confidence
      };
    }
  }

  const reply = msg?.content ?? "I can help with that.";
  await appendMemory(sessionId, message, reply);

  return {
    sessionId,
    reply,
    confidence
  };
}

router.post("/ai/execute", async (req: Request, res: Response) => {
  try {
    const { message, sessionId } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Message required" });
    }

    const result = await executeChat(message, typeof sessionId === "string" ? sessionId : undefined);

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

  const result = await executeChat(message, sessionId ?? payload?.userId);

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
