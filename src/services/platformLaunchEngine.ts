import { pool } from "../db/index";
import { callBFServer } from "../integrations/bfServerClient";

type CampaignRow = {
  id: string;
  budget: number | string;
};

type GeneratedAdRow = {
  headline: string;
  body: string;
  cta: string;
};

export async function launchPlatformCampaign(campaignId: string): Promise<void> {
  const campaign = await pool.query<CampaignRow>(
    `
    SELECT * FROM maya_campaigns WHERE id = $1
  `,
    [campaignId]
  );

  if (!campaign.rows.length) {
    return;
  }

  const c = campaign.rows[0];

  const ad = await pool.query<GeneratedAdRow>(
    `
    SELECT * FROM maya_generated_ads WHERE campaign_id = $1
  `,
    [campaignId]
  );

  if (!ad.rows.length) {
    return;
  }

  const adData = ad.rows[0];

  const payload = {
    name: `Maya Campaign ${Date.now()}`,
    budget: c.budget,
    headline: adData.headline,
    description: adData.body,
    cta: adData.cta
  };

  const response = await callBFServer<{ id?: string }>("/api/marketing/campaign", payload);

  await pool.request(
    `
    UPDATE maya_campaigns
    SET platform_campaign_id = $1,
        status = 'launched'
    WHERE id = $2
  `,
    [response.id || "mock-id", campaignId]
  );
}
