import { checkHealth, cleanupResources } from "./health";
import { logger } from "./infrastructure/logger";

let started = false;

process.on("unhandledRejection", (err) => {
  console.error(err);
  logger.error("runtime_failure", {
    timestamp: new Date().toISOString(),
    operation: "unhandledRejection",
    status: "error",
    err: err instanceof Error ? err.message : String(err)
  });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error(err);
  logger.error("runtime_failure", {
    timestamp: new Date().toISOString(),
    operation: "uncaughtException",
    status: "error",
    err: err.message
  });
  process.exit(1);
});

const shutdown = async () => {
  await cleanupResources();
  logger.info("runtime_shutdown", {
    timestamp: new Date().toISOString(),
    operation: "shutdown",
    status: "ok"
  });
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

function start(): void {
  logger.info("runtime_ready", {
    timestamp: new Date().toISOString(),
    operation: "startup",
    status: "ok"
  });
}

async function bootstrapRuntime(): Promise<void> {
  if (started) {
    throw new Error("Double start detected");
  }

  started = true;
  await checkHealth();
  start();
}

bootstrapRuntime().catch((err) => {
  logger.error("runtime_startup_failed", {
    timestamp: new Date().toISOString(),
    operation: "startup",
    status: "error",
    err: err instanceof Error ? err.message : String(err)
  });
  process.exit(1);
});
