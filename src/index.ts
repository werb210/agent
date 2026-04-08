import { startServer } from "./server";
import fs from "fs";

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

run().catch((error) => {
  console.error("Failed to start service", error);
  process.exitCode = 1;
});
