import { determineTopIndustries } from "./industryTargetingEngine";
import { generateAdCopy } from "./adCopyEngine";
import { launchPlatformCampaign } from "./platformLaunchEngine";
import { reinvestRevenue } from "./reinvestmentEngine";
import { pool } from "../db";
import { enforceKillSwitch } from "../core/mayaSafety";

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
