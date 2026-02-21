import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function logCall(sessionId: string, transcript: string) {
  await pool.query(
    `INSERT INTO call_logs (session_id, transcript, created_at)
     VALUES ($1, $2, NOW())`,
    [sessionId, transcript]
  );
}
