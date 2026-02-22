export function calculateFeatureContributions(payload: any) {
  const contributions = {
    funding_amount: payload.funding_amount * 0.00001,
    annual_revenue: payload.annual_revenue * 0.000005,
    time_in_business: payload.time_in_business * 0.01
  };

  return contributions;
}
