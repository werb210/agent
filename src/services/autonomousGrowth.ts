import { determineTopIndustries } from "./industryTargetingEngine.js";
import { generateAdCopy } from "./adCopyEngine.js";
import { launchPlatformCampaign } from "./platformLaunchEngine.js";
import { reinvestRevenue } from "./reinvestmentEngine.js";
import { pool } from "../integrations/bfServerClient.js";
import { enforceKillSwitch } from "../core/mayaSafety.js";

export async function autonomousGrowthCycle(): Promise<void> {
  enforceKillSwitch();
  const industries = await determineTopIndustries();

  for (const industry of industries) {
    const result = await pool.query<{ id: string }>(
      `
      INSERT INTO maya_campaigns
      (channel, budget, target_industry, target_region, status, expected_roi)
      VALUES ('google',10000,$1,'North America','planned',2.5)
      RETURNING id
    `,
      [industry]
    );

    const campaignId = result.rows[0].id;

    await generateAdCopy(campaignId, industry);
    await launchPlatformCampaign(campaignId);
  }

  await reinvestRevenue();
}
