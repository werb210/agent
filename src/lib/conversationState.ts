import { pool } from "../integrations/bfServerClient.js";

export async function saveState(callId: string, state: unknown) {
  await pool.query(
    `
    INSERT INTO call_state (call_id, state, updated_at)
    VALUES ($1, $2, NOW())
    ON CONFLICT (call_id)
    DO UPDATE SET state = EXCLUDED.state, updated_at = NOW()
    `,
    [callId, JSON.stringify(state)]
  );
}

export async function getState(callId: string) {
  const res = await pool.query(
    "SELECT state FROM call_state WHERE call_id = $1",
    [callId]
  );

  return res.rows[0]?.state || null;
}
