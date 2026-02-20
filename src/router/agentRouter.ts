import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import OpenAI from "openai";
import { pool } from "../db";

type RouteAgentResult = {
  content: string;
  internal?: {
    sessionId: string;
    task: string;
    confidence?: number;
  };
};

const router = Router();

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

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `
You are Maya, a business SMS assistant.
Be helpful and conversational.
Use tools when needed.
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

    return {
      sessionId: currentSessionId,
      reply: `Booking request received for ${args.date} at ${args.time}.`,
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
