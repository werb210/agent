import { AppError } from "../errors/AppError.js";
export function validatePerformance(result: any) {
  if (result.errors > 0) {
    throw new AppError("internal_error", 500, "Load test failed: errors detected");
  }

  if (result.requests.average < 100) {
    throw new AppError("internal_error", 500, "Throughput below threshold");
  }

  return true;
}
