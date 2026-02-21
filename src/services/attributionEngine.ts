import { pool } from "../db";

export async function recordAttribution(data: any) {
  await pool.query(
    "INSERT INTO maya_attribution (lead_id, source, medium, campaign, revenue) VALUES ($1,$2,$3,$4,$5)",
    [data.lead_id, data.source, data.medium, data.campaign, data.revenue]
  );
}

export async function channelPerformance() {
  const res = await pool.query(
    "SELECT source, SUM(revenue) as total_revenue, COUNT(*) as leads FROM maya_attribution GROUP BY source"
  );
  return res.rows;
}
