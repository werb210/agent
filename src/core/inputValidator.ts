export function validateQualificationInput(payload: any) {
  if (!payload?.funding_amount || payload.funding_amount <= 0) {
    throw new Error("Invalid funding amount");
  }

  if (!payload?.annual_revenue || payload.annual_revenue <= 0) {
    throw new Error("Invalid annual revenue");
  }

  if (payload?.time_in_business == null || payload.time_in_business < 0) {
    throw new Error("Invalid time in business");
  }

  if (!payload?.product_type) {
    throw new Error("Product type required");
  }

  return true;
}
