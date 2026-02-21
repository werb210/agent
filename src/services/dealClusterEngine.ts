export interface DealInput {
  revenue: number;
  yearsInBusiness: number;
  requestedAmount: number;
}

export function classifyDeal(input: DealInput): string {
  if (
    input.revenue > 100000 &&
    input.yearsInBusiness > 3 &&
    input.requestedAmount < input.revenue * 2
  ) {
    return "prime_cluster";
  }

  if (
    input.revenue > 40000 &&
    input.yearsInBusiness > 1
  ) {
    return "mid_cluster";
  }

  return "risk_cluster";
}
