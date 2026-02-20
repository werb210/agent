export function scoreDeal(data: any) {
  let score = 0;

  if (data.time_in_business_months >= 24) score += 25;
  else if (data.time_in_business_months >= 6) score += 15;

  if (data.monthly_revenue >= 50000) score += 25;
  else if (data.monthly_revenue >= 20000) score += 15;

  if (data.funding_amount && data.monthly_revenue) {
    const ratio = data.funding_amount / data.monthly_revenue;
    if (ratio <= 3) score += 25;
    else if (ratio <= 6) score += 15;
  }

  if (data.industry) score += 10;
  if (data.purpose) score += 10;

  const risk =
    score >= 70 ? "LOW" :
    score >= 45 ? "MEDIUM" :
    "HIGH";

  return { score, risk };
}
