import "./infrastructure/env";
import { NextFunction, Request, Response } from "express";
import { app } from "./server";
import { mayaQueue } from "./infrastructure/mayaQueue";
import { AppError } from "./errors/AppError";
import { redis } from "./infrastructure/redis";
import { logger } from "./infrastructure/logger";
import { register } from "./infrastructure/metrics";
import { registerMayaAgents } from "./agents/registerAgents";
import { processRetryQueue } from "./core/retryWorker";
import { runRetentionPurge } from "./compliance/purgeJob";
import { errorMiddleware } from "./middleware/error.middleware";
import { clearLocks } from "./services/lock.service";
import { registerListeners } from "./events/registerListeners";
import { validateEnv } from "./startup/validateEnv";
import { startWorker } from "./queue/worker";
import { setupShutdown } from "./startup/registerShutdown";

validateEnv();

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", { err });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { err });
  process.exit(1);
});

function requireEnvVar(key: string) {
  if (!process.env[key]) {
    throw new AppError("internal_error", 500, `Missing ${key}`);
  }
}

if (process.env.NODE_ENV === "production") {
  if (!process.env.ML_INTERNAL_SECRET) {
    throw new AppError("internal_error", 500, "Missing internal secret.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new AppError("internal_error", 500, "Missing OpenAI key.");
  }
}

[
  "OPENAI_API_KEY",
  "ML_SERVICE_URL",
  "ML_INTERNAL_SECRET",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER",
  "PUBLIC_WEBHOOK_URL",
  "BF_SERVER_URL",
  "BF_SERVER_TOKEN",
  "MAYA_SECRET"
].forEach(requireEnvVar);

app.get("/ready", async (_req, res) => {
  res.json({ status: "ready" });
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof SyntaxError) {
    return res.status(400).json({
      error: "bad_request",
      message: "invalid_json"
    });
  }

  return next(err);
});

app.use(errorMiddleware);

async function scheduleJobs() {
  await mayaQueue.add("full-cycle", {}, { repeat: { pattern: "0 2 * * *" } });
  await mayaQueue.add("strategy", {}, { repeat: { pattern: "0 3 * * *" } });
  await mayaQueue.add("growth", {}, { repeat: { pattern: "0 4 * * *" } });
  await mayaQueue.add("advanced-intel", {}, { repeat: { pattern: "0 5 * * *" } });
  await mayaQueue.add("startup-check", {}, { repeat: { pattern: "0 * * * *" } });
}

async function start() {
  registerMayaAgents();
  registerListeners();
  setupShutdown();
  for (let i = 0; i < 2; i++) {
    void startWorker(async () => {
      // placeholder worker loop for v1 queue wiring
    });
  }
  await redis.ping();
  await scheduleJobs();

  const retryInterval = setInterval(() => {
    void processRetryQueue();
  }, 30000);

  const retentionInterval = setInterval(() => {
    void runRetentionPurge();
  }, 24 * 60 * 60 * 1000);

  const port = Number(process.env.PORT || 4000);
  const server = app.listen(port, () => {
    logger.info("Agent service started", { port });
  });

  const shutdown = () => {
    logger.info("Shutting down Maya gracefully...");
    clearLocks();
    clearInterval(retryInterval);
    clearInterval(retentionInterval);
    server.close(() => {
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
}

void start();
