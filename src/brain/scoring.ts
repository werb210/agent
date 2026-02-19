import { prisma } from "../config/db";
import { LeadInput } from "../types/lead";

export async function scoreLead(lead: LeadInput) {
  let score = 0;

  if (lead.requestedAmount > 500000) score += 30;
  else if (lead.requestedAmount > 150000) score += 20;
  else score += 10;

  if (lead.underwritingReadiness === "ready") score += 30;
  else if (lead.underwritingReadiness === "partial") score += 15;

  if (lead.creditScore && lead.creditScore >= 720) score += 25;
  else if (lead.creditScore && lead.creditScore >= 650) score += 15;

  const industryMetric = await prisma.performanceMetric.findFirst({
    where: {
      category: "industry",
      key: lead.industry
    }
  });

  if (industryMetric && industryMetric.avgCommission > 20000) {
    score += 10;
  }

  const probability = Math.min(score, 95);

  const COMMISSION_RATE = 0.03;
  const expectedCommission =
    lead.requestedAmount * COMMISSION_RATE * (probability / 100);

  return {
    riskLevel:
      probability > 70 ? "low" : probability > 40 ? "medium" : "high",
    fundingProbability: probability,
    expectedCommission,
    confidenceScore: 75
  };
}
