import { pool } from "../db";

type RevenueRow = {
  total: string | number | null;
};

type StrategyRow = {
  recommended_actions: {
    increase_budget_channels?: string[];
  } | null;
};

export async function reinvestRevenue(): Promise<void> {
  const revenue = await pool.query<RevenueRow>(`
    SELECT SUM(revenue) as total
    FROM maya_booking_analytics
    WHERE closed = true
    AND created_at > NOW() - INTERVAL '30 days'
  `);

  const total = Number(revenue.rows[0]?.total || 0);

  const reinvestAmount = total * 0.25;

  const strategy = await pool.query<StrategyRow>(`
    SELECT * FROM maya_strategy_plans
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (!strategy.rows.length) {
    return;
  }

  const channels = strategy.rows[0].recommended_actions?.increase_budget_channels || [];

  const perChannelBudget = reinvestAmount / (channels.length || 1);

  for (const channel of channels) {
    await pool.query(
      `
      INSERT INTO maya_campaigns
      (channel, budget, target_industry, target_region, status, expected_roi)
      VALUES ($1,$2,$3,$4,'planned',2.0)
    `,
      [channel, perChannelBudget, "High Performing Industry", "North America"]
    );
  }
}
