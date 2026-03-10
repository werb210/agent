import { pool } from "../db";


export async function createCallBooking(sessionId: string, phone: string, requestedTime: string) {
  const result = await pool.request(
    `INSERT INTO call_bookings (session_id, phone, requested_time)
     VALUES ($1, $2, $3)
     RETURNING id, session_id, phone, requested_time, status`,
    [sessionId, phone, requestedTime]
  );

  return result.rows[0];
}
