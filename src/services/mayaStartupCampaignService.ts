import { pool } from "../integrations/bfServerClient.js";
import { generateAdCopy } from "./adCopyEngine.js";
import { launchPlatformCampaign } from "./platformLaunchEngine.js";

type CampaignInsertRow = { id: string };

export async function launchStartupCampaign(): Promise<void> {
  const campaign = await pool.query<CampaignInsertRow>(`
    INSERT INTO maya_campaigns
    (channel, budget, target_industry, target_region, status, expected_roi)
    VALUES ('google',15000,'Startup','North America','planned',2.8)
    RETURNING id
  `);

  const campaignId = campaign.rows[0].id;

  await generateAdCopy(campaignId, "Startup");

  await launchPlatformCampaign(campaignId);
}
