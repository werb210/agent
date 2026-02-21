import "dotenv/config";
import "./server";
import { clearExpiredLiveCalls } from "./services/liveCallMonitor";
import { recalculateBrokerPerformance } from "./services/performanceEngine";
import { adjustMarketingAllocation } from "./services/marketingEngine";
import { generateRevenueForecast } from "./services/forecastEngine";
import { calculateBrokerCompensation } from "./services/compensationEngine";

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
