import { pool } from "../integrations/bfServerClient.js";

export async function flagSessionCompliance(sessionId?: string) {
  if (!sessionId) {
    return;
  }

  await pool.request(
    `UPDATE sessions SET compliance_flag = true WHERE session_id = $1`,
    [sessionId]
  );
}
