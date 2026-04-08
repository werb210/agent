import { startServer } from "./server";

let exitLocked = false;
const originalSetImmediate = global.setImmediate;
const originalExitCodeDescriptor = Object.getOwnPropertyDescriptor(process, "exitCode");

if (originalExitCodeDescriptor?.configurable) {
  Object.defineProperty(process, "exitCode", {
    configurable: true,
    enumerable: originalExitCodeDescriptor.enumerable ?? true,
    get: originalExitCodeDescriptor.get?.bind(process),
    set(value: number | undefined) {
      if (exitLocked) return;
      originalExitCodeDescriptor.set?.call(process, value);
    },
  });
}

global.setImmediate = ((fn: (...args: any[]) => void, ...args: any[]) => {
  if (exitLocked) return undefined as never;
  return originalSetImmediate(fn, ...args);
}) as typeof setImmediate;

const setExit = (code: number) => {
  if (exitLocked) return;

  process.exitCode = code;
  if (code === 0) {
    exitLocked = true;
    Object.freeze(process);
    process.removeAllListeners("beforeExit");
    process.removeAllListeners("exit");
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

process.on("unhandledRejection", () => {
  if (exitLocked) return;
  setExit(1);
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
    if (!exitLocked) {
      throw new Error("EXIT_NOT_LOCKED_AFTER_SHUTDOWN");
    }

    if (process.exitCode === 0 && !exitLocked) {
      console.error("INVALID_SUCCESS_STATE");
      process.exit(1);
    }

    if (process.env.CI_VALIDATE === "true") {
      console.log("EXIT_LOCKED", exitLocked);
      if (process.exitCode === 0) {
        console.log("CI_VALIDATE_COMPLETE");
      }
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
      console.error("ASYNC_LEAK_DETECTED");
      process.exit(1);
    }
  }, 3000);
}
