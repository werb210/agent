import { Router } from "express";
import { getQueueLength } from "../queue/queue";
import { getWorkerStats } from "../queue/worker";

export const healthRouter = Router();
const startedAt = Date.now();

healthRouter.get("/agent/health", (_req, res) => {
  const workerStats = getWorkerStats();

  res.json({
    status: "ok",
    queue_length: getQueueLength(),
    active_workers: workerStats.active_workers,
    uptime: Math.floor((Date.now() - startedAt) / 1000)
  });
});
