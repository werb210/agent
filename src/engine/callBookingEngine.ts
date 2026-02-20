import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function createCallBooking(sessionId: string, phone: string, requestedTime: string) {
  const result = await pool.query(
    `INSERT INTO call_bookings (session_id, phone, requested_time)
     VALUES ($1, $2, $3)
     RETURNING id, session_id, phone, requested_time, status`,
    [sessionId, phone, requestedTime]
  );

  return result.rows[0];
}
