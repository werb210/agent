import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function getAvailableStaff() {
  const result = await pool.query(
    `SELECT staff_id
     FROM staff_presence
     WHERE is_online = true
     AND is_on_call = false
     ORDER BY updated_at DESC`
  );

  return result.rows.map((r) => r.staff_id);
}
