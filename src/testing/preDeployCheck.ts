import { runLoadTest } from "./loadTest";
import { validatePerformance } from "./performanceCheck";

export async function preDeployValidation() {
  const loadResult = await runLoadTest();
  validatePerformance(loadResult);

  if (process.env.NODE_ENV !== "production") {
    console.info("Pre-deployment validation passed.");
  }
}

void preDeployValidation();
