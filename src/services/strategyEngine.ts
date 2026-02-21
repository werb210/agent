import { pool } from "../db";
import { logAudit } from "../infrastructure/mayaAudit";

export async function generateStrategicPlan() {
  const revenueData = await pool.query(`
    SELECT SUM(predicted_revenue) as projected
    FROM maya_revenue_forecast
    WHERE created_at > NOW() - INTERVAL '30 days'
  `);

  const marketingData = await pool.query(`
    SELECT channel, roi, performance_weight
    FROM maya_marketing_metrics
  `);

  const projectedRevenue = Number(revenueData.rows[0].projected || 0);

  const highPerformingChannels = marketingData.rows.filter((channel) => channel.roi > 2).map((channel) => channel.channel);

  const underperformingChannels = marketingData.rows.filter((channel) => channel.roi < 1).map((channel) => channel.channel);

  const strategicFocus = projectedRevenue < 500000 ? "Aggressive Growth Mode" : "Optimization Mode";

  const recommendedActions = {
    increase_budget_channels: highPerformingChannels,
    reduce_budget_channels: underperformingChannels,
    focus_industry: "High Revenue Industries",
    booking_optimization: true
  };

  const confidence = projectedRevenue > 0 ? 0.8 : 0.5;

  await pool.query(
    `
      INSERT INTO maya_strategy_plans
      (month, strategic_focus, recommended_actions, projected_growth, confidence)
      VALUES ($1,$2,$3,$4,$5)
    `,
    [new Date().toISOString().slice(0, 7), strategicFocus, recommendedActions, projectedRevenue, confidence]
  );

  await logAudit("maya", "strategy_generation", {
    strategicFocus,
    projectedRevenue,
    confidence,
    channels: recommendedActions
  });
}
