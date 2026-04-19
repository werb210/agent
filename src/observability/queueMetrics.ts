import { getQueueLength } from "../queue/queue.js"
import { getWorkerMetrics } from "../queue/worker.js"

export function getQueueMetrics() {
  return {
    queueDepth: getQueueLength(),
    worker: getWorkerMetrics(),
    timestamp: Date.now()
  }
}
