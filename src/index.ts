import { checkHealth } from "./health";

async function bootstrapRuntime(): Promise<void> {
  try {
    await checkHealth();
    console.log("Maya runtime ready");
  } catch (err) {
    console.error("Startup health check failed", err);
    process.exit(1);
  }
}

void bootstrapRuntime();
