import express from "express"
import { queueLength } from "../queue/jobQueue"

const router = express.Router()

const start = Date.now()

router.get("/agent/health", (req, res) => {

  res.json({
    status: "ok",
    uptime: Date.now() - start,
    queueDepth: queueLength()
  })

})

export default router
