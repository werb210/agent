import { pool } from "../db";

export async function detectCampaignAnomaly() {
  const result = await pool.query(`
    SELECT AVG(metric_value) as avg
    FROM maya_metrics
    WHERE metric_name='capital_efficiency'
    AND created_at > NOW() - INTERVAL '14 days'
  `);

  const avg = Number(result.rows[0].avg || 0);

  if (avg < 1.5) {
    return { anomaly: true, reason: "Low capital efficiency" };
  }

  return { anomaly: false };
}
