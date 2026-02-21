import { pool } from "../db";

export async function calculateZScore(deal: any) {
  const stats = await pool.query(
    "SELECT AVG(requested_amount) as avg, STDDEV(requested_amount) as std FROM deal_features"
  );

  const avg = Number(stats.rows[0].avg || 0);
  const std = Number(stats.rows[0].std || 1);

  const z = (deal.requested_amount - avg) / std;

  if (Math.abs(z) > 3) {
    return { flagged: true, zScore: z };
  }

  return { flagged: false, zScore: z };
}
