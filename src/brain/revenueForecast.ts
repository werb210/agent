import { prisma } from "../config/db";

export async function forecastMonthlyRevenue() {
  const deals = await prisma.leadAnalysis.findMany();

  const totalExpected = deals.reduce((sum, d) => sum + d.expectedCommission, 0);

  const projectedFundRate = 0.35;
  const projectedRevenue = totalExpected * projectedFundRate;

  return {
    pipelineValue: totalExpected,
    projectedRevenue,
    forecastConfidence: 70
  };
}
