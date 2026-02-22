import { pool } from "../db";

export async function detectMLDrift() {
  const recent = await pool.query(`
    SELECT AVG(metric_value) as avg_prob
    FROM maya_metrics
    WHERE metric_name='ml_prediction_probability'
    AND created_at > NOW() - INTERVAL '7 days'
  `);

  const historical = await pool.query(`
    SELECT AVG(metric_value) as avg_prob
    FROM maya_metrics
    WHERE metric_name='ml_prediction_probability'
    AND created_at < NOW() - INTERVAL '30 days'
  `);

  const r = Number(recent.rows[0].avg_prob || 0);
  const h = Number(historical.rows[0].avg_prob || 0);

  return Math.abs(r - h);
}
