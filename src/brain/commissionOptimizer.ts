import { prisma } from "../config/db";

export async function optimizeCommission(
  requestedAmount: number,
  industry: string,
  baseProbability: number
) {
  const industryMetric = await prisma.performanceMetric.findFirst({
    where: {
      category: "industry",
      key: industry
    }
  });

  const historicalBoost = industryMetric ? industryMetric.successRate * 2 : 0;

  const adjustedProbability = Math.min(baseProbability + historicalBoost, 95);

  const COMMISSION_RATE = 0.03;

  const expectedRevenue =
    requestedAmount * COMMISSION_RATE * (adjustedProbability / 100);

  const salesPriorityScore =
    expectedRevenue > 25000
      ? 100
      : expectedRevenue > 10000
      ? 75
      : expectedRevenue > 5000
      ? 50
      : 25;

  return {
    adjustedProbability,
    expectedRevenue,
    salesPriorityScore
  };
}
