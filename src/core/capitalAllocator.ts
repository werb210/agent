export interface IndustryAllocationInput {
  name: string;
  conversion_rate: number;
  avg_ticket: number;
}

export function allocateMarketingBudget(totalBudget: number, industries: IndustryAllocationInput[]) {
  const weights = industries.map((industry) => industry.conversion_rate * industry.avg_ticket);

  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);

  return industries.map((industry, index) => ({
    industry: industry.name,
    allocated_budget: totalWeight === 0 ? 0 : (weights[index] / totalWeight) * totalBudget
  }));
}

export function optimizeCapitalAllocation(deals: any[]) {
  return deals
    .sort((a, b) => b.expected_ltv - a.expected_ltv)
    .slice(0, 20);
}
