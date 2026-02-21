import { pool } from "../db";

export async function optimizeCommission(productType: string) {
  const stats = await pool.query(
    `
      SELECT AVG(funding_amount) AS avg_ticket
      FROM sessions
      WHERE product_type=$1 AND status='funded'
    `,
    [productType]
  );

  const avgTicket = Number(stats.rows[0].avg_ticket || 0);

  const optimalRate =
    avgTicket > 500000
      ? 0.025
      : avgTicket > 200000
      ? 0.03
      : 0.035;

  await pool.query(
    `
      INSERT INTO maya_commission_models
      (product_type, optimal_rate)
      VALUES ($1,$2)
      ON CONFLICT (product_type)
      DO UPDATE SET optimal_rate=$2, updated_at=NOW()
    `,
    [productType, optimalRate]
  );

  return optimalRate;
}
