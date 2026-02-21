import "./infrastructure/env";
import "dotenv/config";
import rateLimit from "express-rate-limit";
import { app } from "./server";
import { mayaQueue } from "./infrastructure/mayaQueue";
import { pool } from "./config/pool";
import { redis } from "./infrastructure/redis";
import { logger } from "./infrastructure/logger";
import { register } from "./infrastructure/metrics";

process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection", { err });
  process.exit(1);
});

process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception", { err });
  process.exit(1);
});

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200
});

app.use(limiter);

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
  await pool.connect();
  await redis.ping();
  await scheduleJobs();

  const port = Number(process.env.PORT || 4000);
  app.listen(port, () => {
    logger.info("Maya SMS Agent running", { port });
  });
}

void start();
