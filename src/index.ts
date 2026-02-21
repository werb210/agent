import "dotenv/config";
import "./server";
import { clearExpiredLiveCalls } from "./services/liveCallMonitor";
import { recalculateBrokerPerformance } from "./services/performanceEngine";
import { adjustMarketingAllocation } from "./services/marketingEngine";
import { generateRevenueForecast } from "./services/forecastEngine";
import { calculateBrokerCompensation } from "./services/compensationEngine";
import { generateStrategicPlan } from "./services/strategyEngine";
import { launchAutonomousCampaigns } from "./services/campaignEngine";

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
