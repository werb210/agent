import { runLoadTest } from "./loadTest";
import { validatePerformance } from "./performanceCheck";

export async function preDeployValidation() {
  const loadResult = await runLoadTest();
  validatePerformance(loadResult);

  if (process.env.NODE_ENV !== "production") {
    console.log("Pre-deployment validation passed.");
  }
}

void preDeployValidation();
