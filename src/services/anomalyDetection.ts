import { pool } from "../db";

export async function detectAnomaly(deal: any) {

  const avg = await pool.query(
    "SELECT AVG(requested_amount) as avg_amount FROM deal_features"
  );

  const avgAmount = Number(avg.rows[0].avg_amount || 0);

  if (deal.requested_amount > avgAmount * 5) {
    return {
      flagged: true,
      reason: "Requested amount significantly above average"
    };
  }

  if (deal.years_in_business < 0) {
    return {
      flagged: true,
      reason: "Invalid years in business"
    };
  }

  return { flagged: false };
}
