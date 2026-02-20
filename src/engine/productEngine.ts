export function determineProduct(data: any) {
  if (!data.monthly_revenue) return "Insufficient Data";

  if (data.monthly_revenue >= 50000 && data.time_in_business_months >= 24)
    return "Term Loan";

  if (data.monthly_revenue >= 20000 && data.time_in_business_months >= 6)
    return "Line of Credit";

  if (data.industry?.toLowerCase().includes("construction"))
    return "Equipment Financing";

  return "Working Capital";
}
