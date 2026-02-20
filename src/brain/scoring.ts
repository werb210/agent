import { LeadInput } from "../types/lead";
import { optimizeCommission } from "./commissionOptimizer";

export async function scoreLead(lead: LeadInput) {
  let score = 0;

  if (lead.requestedAmount > 500000) score += 30;
  else if (lead.requestedAmount > 150000) score += 20;
  else score += 10;

  if (lead.underwritingReadiness === "ready") score += 30;
  else if (lead.underwritingReadiness === "partial") score += 15;

  if (lead.creditScore && lead.creditScore >= 720) score += 25;
  else if (lead.creditScore && lead.creditScore >= 650) score += 15;

  const baseProbability = Math.min(score, 95);

  const optimization = await optimizeCommission(
    lead.requestedAmount,
    lead.industry,
    baseProbability
  );

  return {
    riskLevel:
      optimization.adjustedProbability > 70
        ? "low"
        : optimization.adjustedProbability > 40
        ? "medium"
        : "high",
    fundingProbability: optimization.adjustedProbability,
    expectedCommission: optimization.expectedRevenue,
    salesPriorityScore: optimization.salesPriorityScore,
    confidenceScore: 80
  };
}
