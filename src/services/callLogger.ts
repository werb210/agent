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

export async function logCallSummary(callSid: string, summary: string, score: number) {
  await pool.query(
    `INSERT INTO call_logs (session_id, transcript, score, created_at)
     VALUES ($1, $2, $3, NOW())`,
    [callSid, summary, score]
  );
}
