import { pool } from "../db";
import { CURRENT_AUTONOMY_LEVEL } from "../config/autonomy";


interface LogParams {
  sessionId: string;
  mode: string;
  message: string;
  reply: string;
  confidence: number;
  escalated: boolean;
  violationDetected?: boolean;
}

export async function logDecision(params: LogParams) {
  try {
    await pool.request(
      `INSERT INTO ai_decisions
       (session_id, mode, message, reply, confidence, escalated, violation_detected, autonomy_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        params.sessionId,
        params.mode,
        params.message,
        params.reply,
        params.confidence,
        params.escalated,
        params.violationDetected || false,
        CURRENT_AUTONOMY_LEVEL
      ]
    );
  } catch (err) {
    console.error("Decision logging error:", err);
  }
}
