import { prisma } from "../config/db";
import { cacheGet, cacheSet } from "../infrastructure/mayaCache";

type RevenueForecast = {
  pipelineValue: number;
  projectedRevenue: number;
  forecastConfidence: number;
};

const CACHE_KEY = "maya:revenue-forecast";

export async function forecastMonthlyRevenue(): Promise<RevenueForecast> {
  const cached = await cacheGet<RevenueForecast>(CACHE_KEY);
  if (cached) {
    return cached;
  }

  const deals = await prisma.leadAnalysis.findMany();

  const totalExpected = deals.reduce((sum, d) => sum + d.expectedCommission, 0);

  const projectedFundRate = 0.35;
  const projectedRevenue = totalExpected * projectedFundRate;

  const forecast = {
    pipelineValue: totalExpected,
    projectedRevenue,
    forecastConfidence: 70
  };

  await cacheSet(CACHE_KEY, forecast);
  return forecast;
}
