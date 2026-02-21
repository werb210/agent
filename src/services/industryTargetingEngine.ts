import { pool } from "../db";

type IndustryAggregateRow = {
  industry: string;
  deal_count: string | number;
  total_revenue: string | number | null;
};

export async function determineTopIndustries(): Promise<string[]> {
  const data = await pool.query<IndustryAggregateRow>(`
    SELECT industry, COUNT(*) as deal_count, SUM(revenue) as total_revenue
    FROM maya_booking_analytics
    WHERE closed = true
    GROUP BY industry
  `);

  const ranked = data.rows
    .map((row) => ({
      industry: row.industry,
      score: Number(row.total_revenue || 0) * Number(row.deal_count || 0)
    }))
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, 3).map((row) => row.industry);
}
