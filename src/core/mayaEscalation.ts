export function escalateIfAnomaly(metric: number, threshold: number) {
  if (metric > threshold) {
    throw new Error("Anomaly detected – escalation required");
  }
}

