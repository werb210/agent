import { pool } from "../db";

export async function anonymizeSession(sessionId: string) {
  await pool.query(
    `
    UPDATE sessions
    SET qualification_data = '{}'::jsonb,
        user_email = NULL,
        user_phone = NULL,
        state='archived'
    WHERE session_id=$1
  `,
    [sessionId]
  );
}
