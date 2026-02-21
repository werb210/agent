import { generateStrategicPlan } from "../services/strategyEngine";
import { autonomousGrowthCycle } from "../services/autonomousGrowth";
import { generateRevenueForecast } from "../services/forecastEngine";
import { calculateBrokerCompensation } from "../services/compensationEngine";
import { detectRevenueAnomalies } from "./mayaAnomalyEngine";
import { predictChurn } from "./mayaChurnEngine";

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
