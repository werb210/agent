import { getQueueLength } from "../queue/queue"
import { getWorkerMetrics } from "../queue/worker"

export function getQueueMetrics() {
  return {
    queueDepth: getQueueLength(),
    worker: getWorkerMetrics(),
    timestamp: Date.now()
  }
}
