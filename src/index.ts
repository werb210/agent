import { checkHealth, cleanupResources } from "./health";
import { log } from "./logger";
import { validateEnv } from "./system/env";
import { registerListeners } from "./events/registerListeners";
import { waitForReady } from "./lib/ready";
import { handleError } from "./lib/errorHandler";

if (process.env.NODE_ENV !== "test") {
  try {
    validateEnv();
  } catch (e) {
    console.error("ENV CONFIG ERROR:", e);
    throw e;
  }
}
process.setMaxListeners(25);

let started = false;

process.on("unhandledRejection", (err) => {
  handleError(err);
  log({
    callId: "runtime",
    operation: "unhandledRejection",
    status: "error",
    err: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  handleError(err);
  log({
    callId: "runtime",
    operation: "uncaughtException",
    status: "error",
    err: err.message,
  });
  process.exit(1);
});

const shutdown = async () => {
  await cleanupResources();
  log({ callId: "runtime", operation: "shutdown", status: "ok" });
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

export async function start() {
  if (started) throw new Error("DOUBLE_START");
  started = true;

  await checkHealth();
  log({ callId: "runtime", operation: "startup", status: "ok" });
}

export async function initMaya() {
  registerListeners();
  return start();
}

async function bootstrap() {
  await waitForReady();

  // existing startup logic below
  await initMaya();
}

if (process.env.NODE_ENV !== "test") {
  bootstrap().catch((err) => {
    console.error("Startup failed:", err);
    process.exit(1);
  });
}
