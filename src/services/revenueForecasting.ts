import { pool } from "../db";

export async function forecastPipelineRevenue() {
  const res = await pool.query(
    "SELECT probability, requested_amount FROM maya_live_scores"
  );

  const expectedRevenue = res.rows.reduce(
    (sum, r) => sum + (Number(r.probability) * Number(r.requested_amount || 0)),
    0
  );

  return {
    expectedRevenue,
    dealCount: res.rows.length
  };
}
