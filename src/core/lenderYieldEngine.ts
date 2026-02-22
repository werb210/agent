import { pool } from "../db";

type LenderStatsRow = {
  avg_funding: string | number | null;
  avg_turnaround: string | number | null;
  success_rate: string | number | null;
};

export async function calculateLenderYield(lenderId: string) {
  const stats = await pool.query<LenderStatsRow>(
    `SELECT
      AVG(funding_amount) as avg_funding,
      AVG(EXTRACT(day FROM funded_at - created_at)) as avg_turnaround,
      COUNT(*) FILTER (WHERE status='funded')::float /
      NULLIF(COUNT(*),0) as success_rate
    FROM sessions
    WHERE lender_id=$1`,
    [lenderId]
  );

  const row = stats.rows[0] ?? {
    avg_funding: 0,
    avg_turnaround: 0,
    success_rate: 0
  };

  const avgFunding = Number(row.avg_funding || 0);
  const avgTurnaround = Number(row.avg_turnaround || 0);
  const successRate = Number(row.success_rate || 0);

  const yieldScore = successRate * 0.5 + (1 / (avgTurnaround || 1)) * 0.3 + (avgFunding / 1000000) * 0.2;

  await pool.query(
    `INSERT INTO maya_lender_yield
    (lender_id, avg_funding, avg_turnaround_days, success_rate, yield_score)
    VALUES ($1,$2,$3,$4,$5)
    ON CONFLICT (lender_id)
    DO UPDATE SET
      avg_funding=$2,
      avg_turnaround_days=$3,
      success_rate=$4,
      yield_score=$5,
      updated_at=NOW()`,
    [lenderId, avgFunding, avgTurnaround, successRate, yieldScore]
  );

  return yieldScore;
}
