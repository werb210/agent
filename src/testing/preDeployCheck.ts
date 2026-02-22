import { runLoadTest } from "./loadTest";
import { validatePerformance } from "./performanceCheck";

export async function preDeployValidation() {
  const loadResult = await runLoadTest();
  validatePerformance(loadResult);

  console.log("Pre-deployment validation passed.");
}

void preDeployValidation();
