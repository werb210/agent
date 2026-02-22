import { pool } from "../db";
import { getAverageReward } from "./reinforcementEngine";

export async function optimizeCampaignBudget(campaignId: string) {
  const avgReward = await getAverageReward("campaign");

  const adjustment = avgReward > 0.7 ? 1.15 : avgReward < 0.4 ? 0.85 : 1.0;

  await pool.query(
    `UPDATE maya_campaigns
     SET budget = budget * $1
     WHERE id=$2`,
    [adjustment, campaignId]
  );

  return adjustment;
}
