import { checkHealth, cleanupResources } from "./health";
import { log } from "./logger";

let started = false;

process.on("unhandledRejection", (err) => {
  console.error(err);
  log({
    callId: "runtime",
    operation: "unhandledRejection",
    status: "error",
    err: err instanceof Error ? err.message : String(err)
  });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  console.error(err);
  log({
    callId: "runtime",
    operation: "uncaughtException",
    status: "error",
    err: err.message
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

start().catch((err) => {
  log({
    callId: "runtime",
    operation: "startup",
    status: "error",
    err: err instanceof Error ? err.message : String(err)
  });
  process.exit(1);
});
