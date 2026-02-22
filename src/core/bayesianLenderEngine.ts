import { pool } from "../db";

export async function rankLendersBayesian(payload: any) {
  const lenders = await pool.query(`
    SELECT lender_id, yield_score
    FROM maya_lender_yield
  `);

  return lenders.rows
    .map((l) => ({
      lender_id: l.lender_id,
      score: l.yield_score * payload.approval_probability
    }))
    .sort((a, b) => b.score - a.score);
}
