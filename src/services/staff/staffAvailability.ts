import { pool } from "../../db";

export async function getAvailableStaff() {

  const res = await pool.query(
    "SELECT id, phone FROM staff WHERE status = 'online' AND on_call = false LIMIT 1"
  );

  if (!res.rows.length) return null;

  return res.rows[0];
}
