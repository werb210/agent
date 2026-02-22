import "./infrastructure/env";
import { app } from "./server";
import { mayaQueue } from "./infrastructure/mayaQueue";
import { pool } from "./config/pool";
import { redis } from "./infrastructure/redis";
import { logger } from "./infrastructure/logger";
import { register } from "./infrastructure/metrics";
import { registerMayaAgents } from "./agents/registerAgents";
import { processRetryQueue } from "./core/retryWorker";
import { runRetentionPurge } from "./compliance/purgeJob";

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
    throw new Error(`Missing ${key}`);
  }
}

if (process.env.NODE_ENV === "production") {
  if (!process.env.ML_INTERNAL_SECRET) {
    throw new Error("Missing internal secret.");
  }

  if (!process.env.OPENAI_API_KEY) {
    throw new Error("Missing OpenAI key.");
  }
}

[
  "OPENAI_API_KEY",
  "ML_SERVICE_URL",
  "ML_INTERNAL_SECRET",
  "DATABASE_URL",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_PHONE_NUMBER"
].forEach(requireEnvVar);

app.get("/ready", async (_req, res) => {
  try {
    await pool.query("SELECT 1");
    await redis.ping();
    res.json({ status: "ready" });
  } catch {
    res.status(500).json({ status: "not ready" });
  }
});

app.get("/metrics", async (_req, res) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

async function scheduleJobs() {
  await mayaQueue.add("full-cycle", {}, { repeat: { pattern: "0 2 * * *" } });
  await mayaQueue.add("strategy", {}, { repeat: { pattern: "0 3 * * *" } });
  await mayaQueue.add("growth", {}, { repeat: { pattern: "0 4 * * *" } });
  await mayaQueue.add("advanced-intel", {}, { repeat: { pattern: "0 5 * * *" } });
  await mayaQueue.add("startup-check", {}, { repeat: { pattern: "0 * * * *" } });
}

async function start() {
  registerMayaAgents();
  await pool.connect();
  await redis.ping();
  await scheduleJobs();

  setInterval(() => {
    void processRetryQueue();
  }, 30000);

  setInterval(() => {
    void runRetentionPurge();
  }, 24 * 60 * 60 * 1000);

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    logger.info("Maya SMS Agent running", { port });
  });
}

void start();
