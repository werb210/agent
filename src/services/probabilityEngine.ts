export type FundingProbabilityInput = {
  revenue: number;
  yearsInBusiness: number;
  requestedAmount: number;
  creditScore: number;
};

export function calculateFundingProbability(data: FundingProbabilityInput): number {
  let score = 0;

  if (data.revenue > 50000) score += 20;
  if (data.yearsInBusiness > 2) score += 20;
  if (data.requestedAmount < data.revenue * 3) score += 20;
  if (data.creditScore > 650) score += 20;

  return Math.min(score, 100);
}


export function refineProbability(baseScore: number, historicalFactor: number) {
  return Math.min(100, baseScore * historicalFactor);
}


export function clusterAdjustedProbability(baseProbability: number, cluster: string): number {
  if (cluster === "prime_cluster") return Math.min(100, baseProbability * 1.2);
  if (cluster === "risk_cluster") return Math.max(0, baseProbability * 0.8);

  return baseProbability;
}
