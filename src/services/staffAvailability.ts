import { pool } from "../integrations/bfServerClient";


export async function getAvailableStaff() {
  const result = await pool.request(
    `SELECT staff_id
     FROM staff_presence
     WHERE is_online = true
     AND is_on_call = false
     ORDER BY updated_at DESC`
  );

  return result.rows.map((r) => r.staff_id);
}
