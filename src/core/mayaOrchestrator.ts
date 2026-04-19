import { generateStrategicPlan } from "../services/strategyEngine.js";
import { autonomousGrowthCycle } from "../services/autonomousGrowth.js";
import { generateRevenueForecast } from "../services/forecastEngine.js";
import { calculateBrokerCompensation } from "../services/compensationEngine.js";
import { detectRevenueAnomalies } from "./mayaAnomalyEngine.js";
import { predictChurn } from "./mayaChurnEngine.js";

export async function runFullMayaCycle(): Promise<void> {
  await generateRevenueForecast();
  await calculateBrokerCompensation();
  await generateStrategicPlan();
  await autonomousGrowthCycle();
}

export async function runAdvancedIntelligence(): Promise<void> {
  await detectRevenueAnomalies();
  await predictChurn();
}
