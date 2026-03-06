import { Router } from "express"
import { getQueueMetrics } from "../observability/queueMetrics"

const router = Router()

router.get("/health", (req, res) => {

  const metrics = getQueueMetrics()

  res.json({
    status: "ok",
    uptime: process.uptime(),
    queueDepth: metrics.queueDepth,
    worker: metrics.worker,
    timestamp: metrics.timestamp
  })

})

export default router
