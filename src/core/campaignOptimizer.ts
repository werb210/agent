import { pool } from "../integrations/bfServerClient.js";
import { getAverageReward } from "./reinforcementEngine.js";
import { createCorrelationId, logAudit } from "./auditLogger.js";
import { safeExecute } from "./safeAsync.js";

export async function optimizeCampaignBudget(campaignId: string, correlationId?: string) {
  return safeExecute(async () => {
    const resolvedCorrelationId = correlationId || createCorrelationId();
    const avgReward = await getAverageReward("campaign");

    const adjustment = avgReward > 0.7 ? 1.15 : avgReward < 0.4 ? 0.85 : 1.0;

    const currentBudgetResult = await pool.query<{ budget: number }>(
      `SELECT budget FROM maya_campaigns WHERE id=$1 LIMIT 1`,
      [campaignId]
    );

    const oldBudget = Number(currentBudgetResult.rows[0]?.budget ?? 0);
    const newBudget = oldBudget * adjustment;

    await pool.request(
      `UPDATE maya_campaigns
       SET budget = $1
       WHERE id=$2`,
      [newBudget, campaignId]
    );

    await logAudit({
      correlationId: resolvedCorrelationId,
      agentName: "MarketingAgent",
      actionType: "campaign_budget_adjustment",
      entityType: "campaign",
      entityId: campaignId,
      previousValue: { budget: oldBudget },
      newValue: { budget: newBudget }
    });

    return adjustment;
  }, 1);
}
