import { pool } from "../db";
import { logAudit } from "../infrastructure/mayaAudit";

export async function launchAutonomousCampaigns() {
  const strategy = await pool.query(`
    SELECT * FROM maya_strategy_plans
    ORDER BY created_at DESC
    LIMIT 1
  `);

  if (!strategy.rows.length) {
    return;
  }

  const plan = strategy.rows[0];
  const actions = plan.recommended_actions;

  for (const channel of actions.increase_budget_channels || []) {
    await pool.query(
      `
        INSERT INTO maya_campaigns
        (channel, budget, target_industry, target_region, status, expected_roi, launched_at)
        VALUES ($1,$2,$3,$4,$5,$6,NOW())
      `,
      [channel, 10000, "High Revenue Industries", "North America", "launched", 2.5]
    );

    await logAudit("maya", "campaign_launch", {
      channel,
      budget: 10000,
      targetIndustry: "High Revenue Industries",
      expectedRoi: 2.5
    });
  }
}
