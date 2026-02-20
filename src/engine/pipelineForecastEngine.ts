export function forecastPipeline(deals: any[]) {
  let expectedRevenue = 0;

  for (const deal of deals) {
    expectedRevenue += (deal.probability || 0) * (deal.structured.funding_amount || 0) * 0.02;
  }

  return {
    expectedBrokerRevenue: Number(expectedRevenue.toFixed(2))
  };
}
