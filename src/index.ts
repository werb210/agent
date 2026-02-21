import "dotenv/config";
import "./server";
import { clearExpiredLiveCalls } from "./services/liveCallMonitor";
import { recalculateBrokerPerformance } from "./services/performanceEngine";
import { adjustMarketingAllocation } from "./services/marketingEngine";
import { generateRevenueForecast } from "./services/forecastEngine";
import { calculateBrokerCompensation } from "./services/compensationEngine";
import { generateStrategicPlan } from "./services/strategyEngine";
import { launchAutonomousCampaigns } from "./services/campaignEngine";
import { determineTopIndustries } from "./services/industryTargetingEngine";
import { generateAdCopy } from "./services/adCopyEngine";
import { launchPlatformCampaign } from "./services/platformLaunchEngine";
import { reinvestRevenue } from "./services/reinvestmentEngine";
import { pool } from "./db";

async function autonomousGrowthCycle(): Promise<void> {
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

setInterval(() => {
  void clearExpiredLiveCalls();
}, 60000);

setInterval(() => {
  void recalculateBrokerPerformance();
}, 3600000);

setInterval(() => {
  void adjustMarketingAllocation();
}, 86400000);

setInterval(() => {
  void generateRevenueForecast();
}, 86400000);

setInterval(() => {
  void calculateBrokerCompensation();
}, 86400000);

setInterval(() => {
  void generateStrategicPlan();
}, 86400000);

setInterval(() => {
  void launchAutonomousCampaigns();
}, 86400000);

setInterval(() => {
  void autonomousGrowthCycle();
}, 86400000);
