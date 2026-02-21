import { pool } from "../db";
import { logAudit } from "../infrastructure/mayaAudit";
import { enforceKillSwitch } from "../core/mayaSafety";
import { ENV } from "../infrastructure/env";
import { snapshotCampaign } from "./campaignRollback";
import { requireApproval } from "../core/mayaApprovalGate";
import { logMayaAction } from "./mayaActionLedger";
import { escalateIfAnomaly } from "../core/mayaEscalation";

export async function launchAutonomousCampaigns() {
  enforceKillSwitch();
  const maxBudget = Number(ENV.MAYA_MAX_CAMPAIGN_BUDGET || 50000);
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
    const campaignBudget = 10000;
    await requireApproval("increase_budget", { channel, campaignBudget });
    escalateIfAnomaly(campaignBudget, maxBudget);

    if (campaignBudget > maxBudget) {
      throw new Error("Campaign exceeds global budget cap");
    }
    const campaignInsert = await pool.query<{ id: string }>(
      `
        INSERT INTO maya_campaigns
        (channel, budget, target_industry, target_region, status, expected_roi, launched_at)
        VALUES ($1,$2,$3,$4,$5,$6,NOW())
        RETURNING id
      `,
      [channel, campaignBudget, "High Revenue Industries", "North America", "launched", 2.5]
    );

    await snapshotCampaign(campaignInsert.rows[0].id, {
      channel,
      budget: campaignBudget,
      targetIndustry: "High Revenue Industries",
      targetRegion: "North America",
      expectedRoi: 2.5
    });

    await logAudit("maya", "campaign_launch", {
      channel,
      budget: campaignBudget,
      targetIndustry: "High Revenue Industries",
      expectedRoi: 2.5
    });
    await logMayaAction("increase_budget", { channel, campaignBudget }, "executed");
  }
}
