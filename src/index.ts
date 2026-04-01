import { checkHealth, cleanupResources } from "./health";
import { logger } from "./infrastructure/logger";

let started = false;

process.on("unhandledRejection", (err) => {
  logger.error("runtime_failure", {
    timestamp: new Date().toISOString(),
    operation: "unhandledRejection",
    success: false,
    err: err instanceof Error ? err.message : String(err)
  });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("runtime_failure", {
    timestamp: new Date().toISOString(),
    operation: "uncaughtException",
    success: false,
    err: err.message
  });
  process.exit(1);
});

const shutdown = async () => {
  await cleanupResources();
  logger.info("runtime_shutdown", {
    timestamp: new Date().toISOString(),
    operation: "shutdown",
    success: true
  });
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

async function bootstrapRuntime(): Promise<void> {
  if (started) {
    throw new Error("Service already started");
  }

  await checkHealth();
  started = true;
  logger.info("runtime_ready", {
    timestamp: new Date().toISOString(),
    operation: "startup",
    success: true
  });
}

bootstrapRuntime().catch((err) => {
  logger.error("runtime_startup_failed", {
    timestamp: new Date().toISOString(),
    operation: "startup",
    success: false,
    err: err instanceof Error ? err.message : String(err)
  });
  process.exit(1);
});
