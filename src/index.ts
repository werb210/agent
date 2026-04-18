import { startServer } from "./server";
import fs from "fs";
import { fileURLToPath } from "url";

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

  validateProductionEnv(process.env);

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

export function validateProductionEnv(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV !== "production") {
    return;
  }

  if (!env.AGENT_API_TOKEN || env.AGENT_API_TOKEN === "test_token") {
    console.warn(
      "[WARN] AGENT_API_TOKEN is not set or is test_token. " +
        "Set this in Azure App Service → Configuration. " +
        "Maya will start in degraded mode.",
    );
  }

  if (!env.JWT_SECRET || env.JWT_SECRET === "test_secret") {
    console.warn("[WARN] JWT_SECRET must be set in production. Maya will start in degraded mode.");
  }

  // AGENT_SHARED_SECRET is required for authenticated agent→server calls.
  // Warn loudly rather than crashing so the agent starts in degraded mode and
  // the portal health badge surfaces the problem instead of a dead service.
  if (!env.AGENT_SHARED_SECRET) {
    console.warn(
      "[WARN] AGENT_SHARED_SECRET is not set. " +
        "Authenticated agent→server calls will fail. " +
        "Set this in Azure App Service → Configuration to match BF-Server JWT_SECRET.",
    );
  }
}

const isMainEntry = (() => {
  if (!process.argv[1]) {
    return false;
  }

  try {
    return fs.realpathSync(process.argv[1]) === fs.realpathSync(fileURLToPath(import.meta.url));
  } catch {
    return false;
  }
})();

if (isMainEntry) {
  run().catch((error) => {
    console.error("Failed to start service", error);
    process.exitCode = 1;
  });
}
