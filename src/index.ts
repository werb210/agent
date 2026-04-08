import { startServer } from "./server";

let exitLocked = false;
let quietRuntimeFailures = false;

const setExit = (code: number) => {
  if (exitLocked) {
    return;
  }

  process.exitCode = code;
  if (code === 0) {
    exitLocked = true;
  }
};

process.on("unhandledRejection", (error) => {
  if (quietRuntimeFailures) {
    return;
  }

  console.error("Unhandled rejection", error);
  setExit(1);
});

process.on("uncaughtException", (error) => {
  if (quietRuntimeFailures) {
    return;
  }

  console.error("Uncaught exception", error);
  setExit(1);
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
  const ciValidate = process.env.CI_VALIDATE === "true";

  if (!ciValidate) {
    setExit(0);
    return;
  }

  const leakGuardTimer = setTimeout(() => {
    console.error("FORCED EXIT (LEAK DETECTED)");
    process.exit(1);
  }, 10_000);

  try {
    const port = started.envStatus.values.port;
    await runValidationChecks(port);
    setExit(0);
  } catch (error) {
    console.error("CI validation failure", error);
    setExit(1);
  } finally {
    clearTimeout(leakGuardTimer);
    await started.shutdown();
    quietRuntimeFailures = exitLocked;
    setImmediate(() => {
      process.exit(process.exitCode ?? 0);
    });
  }
}

run().catch((error) => {
  console.error("Failed to start service", error);
  setExit(1);
  return;
});
