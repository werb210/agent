import "dotenv/config";
import "./server";
import { clearExpiredLiveCalls } from "./services/liveCallMonitor";
import { recalculateBrokerPerformance } from "./services/performanceEngine";
import { adjustMarketingAllocation } from "./services/marketingEngine";
import { launchAutonomousCampaigns } from "./services/campaignEngine";
import { runFullMayaCycle } from "./core/mayaOrchestrator";

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
  void launchAutonomousCampaigns();
}, 86400000);

setInterval(() => {
  void runFullMayaCycle();
}, 86400000);
