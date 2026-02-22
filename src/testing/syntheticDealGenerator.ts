export function generateSyntheticDeal() {
  return {
    funding_amount: Math.floor(Math.random() * 500000) + 50000,
    annual_revenue: Math.floor(Math.random() * 2000000) + 100000,
    time_in_business: Math.floor(Math.random() * 10) + 1,
    product_type: "LOC",
    industry: "general"
  };
}
