import { pool } from "../db";

interface BrokerStatsRow {
  close_rate: number | null;
  avg_ticket: number | null;
}

export async function calculateBrokerScore(brokerId: string): Promise<number> {
  const stats = await pool.query<BrokerStatsRow>(`
    SELECT 
      COUNT(*) FILTER (WHERE status='funded')::float /
      NULLIF(COUNT(*),0) AS close_rate,
      AVG(funding_amount) AS avg_ticket
    FROM sessions
    WHERE assigned_broker_id=$1
  `, [brokerId]);

  const closeRate = stats.rows[0]?.close_rate ?? 0;
  const avgTicket = stats.rows[0]?.avg_ticket ?? 0;

  const performance = (closeRate * 0.6) + (avgTicket / 1000000 * 0.4);

  await pool.query(`
    INSERT INTO maya_broker_scores
    (broker_id, close_rate, avg_ticket, performance_score)
    VALUES ($1,$2,$3,$4)
    ON CONFLICT (broker_id)
    DO UPDATE SET
      close_rate=$2,
      avg_ticket=$3,
      performance_score=$4,
      updated_at=NOW()
  `, [brokerId, closeRate, avgTicket, performance]);

  return performance;
}
