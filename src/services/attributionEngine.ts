import { pool } from "../db";
import { cacheGet, cacheSet } from "../infrastructure/mayaCache";

type ChannelPerformanceRow = {
  source: string;
  total_revenue: string;
  leads: string;
};

const CACHE_KEY = "maya:campaign-performance";

export async function recordAttribution(data: any) {
  await pool.query(
    "INSERT INTO maya_attribution (lead_id, source, medium, campaign, revenue) VALUES ($1,$2,$3,$4,$5)",
    [data.lead_id, data.source, data.medium, data.campaign, data.revenue]
  );
}

export async function channelPerformance(): Promise<ChannelPerformanceRow[]> {
  const cached = await cacheGet<ChannelPerformanceRow[]>(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const res = await pool.query<ChannelPerformanceRow>(
    "SELECT source, SUM(revenue) as total_revenue, COUNT(*) as leads FROM maya_attribution GROUP BY source"
  );

  await cacheSet(CACHE_KEY, res.rows);
  return res.rows;
}
