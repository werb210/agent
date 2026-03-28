import { runLoadTest } from "./loadTest";
import { validatePerformance } from "./performanceCheck";

export async function preDeployValidation() {
  if (process.env.NODE_ENV !== "production" && !process.env.LOAD_TEST_URL) {
    console.info("Skipping load test: set LOAD_TEST_URL to enable predeploy load validation.");
    return;
  }

  const loadResult = await runLoadTest();
  validatePerformance(loadResult);

  if (process.env.NODE_ENV !== "production") {
    console.info("Pre-deployment validation passed.");
  }
}

void preDeployValidation();
