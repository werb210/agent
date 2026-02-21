import { pool } from "../db";

export async function clearExpiredLiveCalls() {
  await pool.query(`
    UPDATE staff_calendar
    SET active_call_until = NULL,
        is_on_call = false
    WHERE active_call_until IS NOT NULL
      AND active_call_until < NOW()
  `);
}
