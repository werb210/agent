export function simulateNegotiation(lenderYield: number, dealRisk: number) {
  const baseRate = lenderYield * 0.6;
  const riskPremium = dealRisk * 0.4;

  return {
    projected_interest_range_low: baseRate + riskPremium,
    projected_interest_range_high: baseRate + riskPremium + 2
  };
}
