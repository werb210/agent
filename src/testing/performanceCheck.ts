export function validatePerformance(result: any) {
  if (result.errors > 0) {
    throw new Error("Load test failed: errors detected");
  }

  if (result.requests.average < 100) {
    throw new Error("Throughput below threshold");
  }

  return true;
}
