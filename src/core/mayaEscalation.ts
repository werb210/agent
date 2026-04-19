import { AppError } from "../errors/AppError.js";
export function escalateIfAnomaly(metric: number, threshold: number) {
  if (metric > threshold) {
    throw new AppError("internal_error", 500, "Anomaly detected – escalation required");
  }
}

