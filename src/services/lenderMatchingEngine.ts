export interface DealProfile {
  revenue: number;
  yearsInBusiness: number;
  requestedAmount: number;
  industry: string;
}

export interface LenderProfile {
  lenderName: string;
  minRevenue: number;
  minYears: number;
  maxExposure: number;
  industriesAllowed: string[];
}

export function scoreLenderMatch(
  deal: DealProfile,
  lender: LenderProfile
) {
  let score = 0;

  if (deal.revenue >= lender.minRevenue) score += 25;
  if (deal.yearsInBusiness >= lender.minYears) score += 25;
  if (deal.requestedAmount <= lender.maxExposure) score += 25;
  if (lender.industriesAllowed.includes(deal.industry)) score += 25;

  return score;
}

export function rankLenders(
  deal: DealProfile,
  lenders: LenderProfile[]
) {
  return lenders
    .map((l) => ({
      lender: l.lenderName,
      score: scoreLenderMatch(deal, l)
    }))
    .sort((a, b) => b.score - a.score);
}

export function buildLenderRecommendationMessage(
  rankedLenders: Array<{ lender: string; score: number }>,
  mode: "staff" | "client"
) {
  if (mode === "staff") {
    const topThree = rankedLenders.slice(0, 3);

    const lines = topThree.map((item, index) => {
      return `${index + 1}. ${item.lender} — ${item.score}%`;
    });

    return `Top 3 Recommended Lenders:\n${lines.join("\n")}`;
  }

  return "Based on your profile, several lenders may be suitable.";
}
