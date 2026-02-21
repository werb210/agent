import { pool } from "../db";

export async function routeDeal(sessionId: string) {
  const brokers = await pool.query<{ broker_id: string }>(`
    SELECT broker_id, performance_score
    FROM maya_broker_scores
    ORDER BY performance_score DESC
    LIMIT 3
  `);

  const selected = brokers.rows[0];

  if (!selected) {
    return null;
  }

  await pool.query(
    `
    UPDATE sessions
    SET assigned_broker_id=$1
    WHERE id=$2
  `,
    [selected.broker_id, sessionId]
  );

  return selected.broker_id;
}
