import { pool } from "../db";

type FundingAverageRow = {
  avg: string | number | null;
};

export async function forecast90Days() {
  const avgMonthly = await pool.query<FundingAverageRow>(`
    SELECT AVG(funding_amount) AS avg
    FROM sessions
    WHERE status='funded'
  `);

  const monthly = Number(avgMonthly.rows[0]?.avg ?? 0);

  return {
    projected_30_day: monthly,
    projected_60_day: monthly * 2,
    projected_90_day: monthly * 3
  };
}
