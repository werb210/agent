import { pool } from "../db";

export async function flagSessionCompliance(sessionId?: string) {
  if (!sessionId) {
    return;
  }

  await pool.query(
    `UPDATE sessions SET compliance_flag = true WHERE session_id = $1`,
    [sessionId]
  );
}
