import { startServer } from "./server";

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
});

async function runValidationChecks(port: number) {
  const [health, ready] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/health`),
    fetch(`http://127.0.0.1:${port}/ready`),
  ]);

  if (!health.ok || !ready.ok) {
    throw new Error(`CI validation failed: health=${health.status} ready=${ready.status}`);
  }
}

async function run() {
  const started = await startServer();

  if (process.env.CI_VALIDATE !== "true") {
    return;
  }

  try {
    const port = started.envStatus.values.port;
    await runValidationChecks(port);
    process.exitCode = 0;
  } catch (error) {
    console.error("CI validation failure", error);
    process.exitCode = 1;
  } finally {
    await started.shutdown();

    if (process.env.CI_VALIDATE === "true") {
      setImmediate(() => {
        process.exit(process.exitCode ?? 0);
      });
    }
  }
}

run().catch((error) => {
  console.error("Failed to start service", error);
  process.exitCode = 1;
  return;
});
