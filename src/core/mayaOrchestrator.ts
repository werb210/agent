import { generateStrategicPlan } from "../services/strategyEngine";
import { autonomousGrowthCycle } from "../services/autonomousGrowth";
import { generateRevenueForecast } from "../services/forecastEngine";
import { calculateBrokerCompensation } from "../services/compensationEngine";

export async function runFullMayaCycle(): Promise<void> {
  await generateRevenueForecast();
  await calculateBrokerCompensation();
  await generateStrategicPlan();
  await autonomousGrowthCycle();
}
