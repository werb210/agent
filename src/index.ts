import { startServer } from "./server";
import fs from "fs";

async function validate(port: number): Promise<boolean> {
  const [health, ready] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/health`),
    fetch(`http://127.0.0.1:${port}/ready`),
  ]);

  return health.ok && ready.ok;
}

async function run() {
  if (process.env.NODE_ENV === "production" && !fs.existsSync("./dist/index.js")) {
    throw new Error("DIST_MISSING");
  }

  if (process.env.NODE_ENV === "production") {
    if (!process.env.AGENT_API_TOKEN || process.env.AGENT_API_TOKEN === "test_token") {
      throw new Error("[FATAL] AGENT_API_TOKEN must be set to a real value in production");
    }
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET === "test_secret") {
      throw new Error("[FATAL] JWT_SECRET must be set in production");
    }
    // AGENT_SHARED_SECRET is required for authenticated agent→server calls.
    // Warn loudly rather than crashing so the agent starts in degraded mode and
    // the portal health badge surfaces the problem instead of a dead service.
    if (!process.env.AGENT_SHARED_SECRET) {
      console.warn(
        "[WARN] AGENT_SHARED_SECRET is not set. " +
          "Authenticated agent→server calls will fail. " +
          "Set this in Azure App Service → Configuration to match BF-Server JWT_SECRET.",
      );
    }
  }

  const started = await startServer();
  const ciValidate = process.env.CI_VALIDATE === "true";

  if (!ciValidate) {
    return;
  }

  try {
    const port = started.envStatus.values.port;
    const passed = await validate(port);

    if (!passed) {
      throw new Error("CI validation failed");
    }

    console.log("CI_VALIDATE_COMPLETE");
    process.exitCode = 0;
  } finally {
    await started.shutdown();
  }
}

run().catch((error) => {
  console.error("Failed to start service", error);
  process.exitCode = 1;
});
