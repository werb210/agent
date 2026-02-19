import { prisma } from "../config/db";

export async function calculateIndustryPerformance() {
  const fundedDeals = await prisma.callOutcome.findMany({
    where: { funded: true }
  });

  const grouped: Record<string, { count: number; total: number }> = {};

  for (const deal of fundedDeals) {
    const analysis = await prisma.leadAnalysis.findUnique({
      where: { id: deal.leadId }
    });

    if (!analysis) continue;

    if (!grouped[analysis.industry]) {
      grouped[analysis.industry] = { count: 0, total: 0 };
    }

    grouped[analysis.industry].count += 1;
    grouped[analysis.industry].total += deal.fundedAmount || 0;
  }

  for (const industry in grouped) {
    const successRate = grouped[industry].count;
    const avgCommission = grouped[industry].total / successRate;

    await prisma.performanceMetric.upsert({
      where: {
        category_key: {
          category: "industry",
          key: industry
        }
      },
      update: {
        successRate,
        avgCommission
      },
      create: {
        category: "industry",
        key: industry,
        successRate,
        avgCommission
      }
    });
  }
}
