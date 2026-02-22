import { pool } from "../db";

type AggregateRow = {
  total: string | number | null;
};

export async function capitalEfficiencyIndex() {
  const revenue = await pool.query<AggregateRow>(`
    SELECT SUM(funding_amount) as total
    FROM sessions WHERE status='funded'
  `);

  const marketing = await pool.query<AggregateRow>(`
    SELECT SUM(spend) as total
    FROM maya_marketing_metrics
  `);

  const totalRevenue = Number(revenue.rows[0]?.total || 0);
  const totalSpend = Number(marketing.rows[0]?.total || 1);

  return totalRevenue / totalSpend;
}
