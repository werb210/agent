import crypto from "crypto";
import { Router, Request, Response } from "express";
import { pool } from "../db";

type RouteAgentResult = {
  content: string;
  internal?: {
    sessionId: string;
    task: string;
  };
};

const router = Router();

async function executeChat(message: string, incomingSessionId?: string): Promise<{
  sessionId: string;
  reply: string;
}> {
  const sessionId = incomingSessionId ?? crypto.randomUUID();
  const task = "chat";
  const data = {
    message,
    timestamp: new Date().toISOString()
  };

  await pool.query(
    `INSERT INTO sessions (session_id, task, data)
     VALUES ($1, $2, $3)`,
    [sessionId, task, data]
  );

  return {
    sessionId,
    reply: `Maya received: ${message}`
  };
}

router.post("/ai/execute", async (req: Request, res: Response) => {
  try {
    const { message } = req.body ?? {};

    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "message is required" });
    }

    const { sessionId, reply } = await executeChat(message);

    return res.json({
      success: true,
      sessionId,
      reply
    });
  } catch (err: any) {
    console.error("AI execute error:", err);
    const message = err instanceof Error && err.message ? err.message : "Internal server error";
    return res.status(500).json({ error: message });
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
    content: result.reply,
    internal: {
      sessionId: result.sessionId,
      task: "chat"
    }
  };
}

export default router;
