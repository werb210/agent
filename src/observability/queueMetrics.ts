import { getQueueLength } from "../queue/queue"

export function getQueueMetrics() {
  return {
    queueDepth: getQueueLength(),
    timestamp: Date.now()
  }
}
