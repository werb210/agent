import { Router, Request, Response } from "express";
import crypto from "crypto";
import OpenAI from "openai";
import { pool } from "../db";

type RouteAgentResult = {
  content: string;
  internal?: {
    sessionId: string;
    task: string;
  };
};

const router = Router();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder"
});

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
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const sessionId = incomingSessionId ?? crypto.randomUUID();

  if (!incomingSessionId) {
    await ensureSession(sessionId);
  }

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are Maya, an intelligent SMS business assistant.
You can book calls and respond naturally.
When appropriate, use tools.
Respond conversationally if no tool is needed.
`
      },
      {
        role: "user",
        content: message
      }
    ],
    tools: [
      {
        type: "function",
        function: {
          name: "book_call",
          description: "Book a phone call for the user",
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

  const msg = completion.choices[0]?.message;

  if (msg?.tool_calls && msg.tool_calls.length > 0) {
    const toolCall = msg.tool_calls[0];

    if (toolCall.function.name === "book_call") {
      const args = JSON.parse(toolCall.function.arguments);
      const memo = `Booking for ${args.date} at ${args.time}`;

      await pool.query(
        `UPDATE sessions
         SET task = $1, memo = $2
         WHERE session_id = $3`,
        ["book_call", memo, sessionId]
      );

      return {
        sessionId,
        reply: `Your call has been scheduled for ${args.date} at ${args.time}.`,
        action: "book_call"
      };
    }
  }

  return {
    sessionId,
    reply: msg?.content ?? "I can help with that."
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
      task: result.action ?? "conversation"
    }
  };
}

export default router;
