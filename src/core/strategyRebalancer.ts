import { capitalEfficiencyIndex } from "./capitalEfficiency";
import { optimizeCampaignBudget } from "./campaignOptimizer";
import { pool } from "../db";

type CampaignRow = {
  id: string;
};

export async function rebalanceStrategy() {
  const efficiency = await capitalEfficiencyIndex();

  const campaigns = await pool.query<CampaignRow>(`
    SELECT id FROM maya_campaigns
    WHERE status='launched'
  `);

  for (const campaign of campaigns.rows) {
    if (efficiency < 2) {
      await optimizeCampaignBudget(campaign.id);
    }
  }

  return {
    efficiency,
    adjusted_campaign_count: efficiency < 2 ? campaigns.rowCount : 0
  };
}
