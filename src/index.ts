import { startServer } from "./server";

let exitLocked = false;

const setExit = (code: number) => {
  if (exitLocked) return;

  process.exitCode = code;
  if (code === 0) {
    exitLocked = true;
    process.removeAllListeners("unhandledRejection");
    process.removeAllListeners("uncaughtException");
  }
};

const getNumericExitCode = (): number => {
  const value = process.exitCode;
  return typeof value === "number" ? value : 0;
};

const handleRuntimeFailure = (label: string, error: unknown) => {
  if (exitLocked) return;
  console.error(label, error);
  setExit(1);
};

process.on("unhandledRejection", (error) => {
  handleRuntimeFailure("Unhandled rejection", error);
});

process.on("uncaughtException", (error) => {
  handleRuntimeFailure("Uncaught exception", error);
});

async function validate(port: number): Promise<boolean> {
  const [health, ready] = await Promise.all([
    fetch(`http://127.0.0.1:${port}/health`),
    fetch(`http://127.0.0.1:${port}/ready`),
  ]);

  return health.ok && ready.ok;
}

async function run() {
  const started = await startServer();
  const ciValidate = process.env.CI_VALIDATE === "true";

  if (!ciValidate) {
    setExit(0);
    exitLocked = true;
    return;
  }

  try {
    const port = started.envStatus.values.port;
    const passed = await validate(port);

    if (!passed) {
      throw new Error("CI validation failed");
    }

    setExit(0);
    exitLocked = true;
  } finally {
    if (!exitLocked && process.exitCode == null) {
      setExit(1);
    }

    const shutdownPromise = started.shutdown();
    await shutdownPromise;

    if (process.env.CI_VALIDATE === "true") {
      console.log("CI_VALIDATE_COMPLETE", process.exitCode ?? 0);
      setImmediate(() => process.exit(getNumericExitCode()));
    }
  }
}

(async () => {
  try {
    await run();
    if (!exitLocked) {
      setExit(getNumericExitCode());
    }
  } catch (error) {
    if (!exitLocked) {
      console.error("Failed to start service", error);
    }
    setExit(1);
  }
})();

if (process.env.CI_VALIDATE === "true") {
  setTimeout(() => {
    if (!exitLocked) {
      console.error("EXIT NOT LOCKED - LEAK");
      process.exit(1);
    }
  }, 5000);
}
