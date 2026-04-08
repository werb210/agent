import { startServer } from "./server";

process.on("unhandledRejection", (error) => {
  console.error("Unhandled rejection", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception", error);
});

async function run() {
  const started = await startServer();

  if (process.env.CI_VALIDATE === "true") {
    try {
      const port = started.envStatus.values.port;
      const [health, ready] = await Promise.all([
        fetch(`http://127.0.0.1:${port}/health`),
        fetch(`http://127.0.0.1:${port}/ready`),
      ]);

      if (!health.ok || !ready.ok) {
        throw new Error(`CI validation failed: health=${health.status} ready=${ready.status}`);
      }

      await started.shutdown();
      process.exit(0);
    } catch (error) {
      console.error("CI validation failure", error);
      await started.shutdown();
      process.exit(1);
    }
  }
}

run().catch((error) => {
  console.error("Failed to start service", error);
  process.exit(1);
});
