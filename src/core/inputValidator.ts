import { AppError } from "../errors/AppError.js";
export function validateQualificationInput(payload: any) {
  if (!payload?.funding_amount || payload.funding_amount <= 0) {
    throw new AppError("bad_request", 400, "Invalid funding amount");
  }

  if (!payload?.annual_revenue || payload.annual_revenue <= 0) {
    throw new AppError("bad_request", 400, "Invalid annual revenue");
  }

  if (payload?.time_in_business == null || payload.time_in_business < 0) {
    throw new AppError("bad_request", 400, "Invalid time in business");
  }

  if (!payload?.product_type) {
    throw new AppError("bad_request", 400, "Product type required");
  }

  return true;
}
