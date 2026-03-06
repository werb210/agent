import { Router } from "express"
import { queueLength } from "../queue/jobQueue"

const router = Router()

router.get("/agent/health", (_, res) => {
  res.json({
    status: "ok",
    queue: queueLength(),
    uptime: process.uptime()
  })
})

export const healthRouter = router
export default router
