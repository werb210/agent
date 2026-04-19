import { getQueueMetrics } from "../observability/queueMetrics.js"
import { enqueueJob, resetQueueForTests } from "../queue/queue.js"
import { resetWorkerMetricsForTests } from "../queue/worker.js"

describe("queue health metrics", () => {
  beforeEach(() => {
    resetQueueForTests()
    resetWorkerMetricsForTests()
  })

  it("reports queue depth and worker metrics", () => {
    enqueueJob({ type: "document_ocr", payload: { id: "doc-1" } })

    const metrics = getQueueMetrics()

    expect(metrics.queueDepth).toBe(1)
    expect(metrics.worker).toEqual({
      running: false,
      activeJobId: null,
      processedJobs: 0,
      failedJobs: 0,
      retryCount: 0
    })
    expect(typeof metrics.timestamp).toBe("number")
  })
})
