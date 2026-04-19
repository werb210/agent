import { runLoadTest } from "./loadTest.js";
import { validatePerformance } from "./performanceCheck.js";

export async function preDeployValidation() {
  const loadResult = await runLoadTest();
  validatePerformance(loadResult);

  if (process.env.NODE_ENV !== "production") {
    console.info("Pre-deployment validation passed.");
  }
}

preDeployValidation().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  console.error("Pre-deployment validation failed.", message);
  process.exit(1);
});
