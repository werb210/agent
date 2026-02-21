import { pool } from "../db";

export async function recommendAssignment() {

  const res = await pool.query(
    "SELECT staff_id, COUNT(*) as active_deals FROM deals GROUP BY staff_id"
  );

  if (!res.rows.length) return null;

  res.rows.sort((a, b) => Number(a.active_deals) - Number(b.active_deals));

  return res.rows[0].staff_id;
}
