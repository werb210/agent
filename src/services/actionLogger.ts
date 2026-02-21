import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

interface LogActionParams {
  sessionId: string;
  actionType: string;
  requiresConfirmation: boolean;
  executed: boolean;
  message?: string;
}

export async function logAction(params: LogActionParams) {
  try {
    await pool.query(
      `INSERT INTO ai_actions
       (session_id, action_type, requires_confirmation, executed, message)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        params.sessionId,
        params.actionType,
        params.requiresConfirmation,
        params.executed,
        params.message || null
      ]
    );
  } catch (err) {
    console.error("Action logging error:", err);
  }
}
