import { dequeue } from "./jobQueue"
import { setTimeout as sleep } from "node:timers/promises";

const MAX_ATTEMPTS = 3
let running = true
let activeJobId: string | null = null
let processedJobs = 0
let failedJobs = 0
let retryCount = 0

export async function startWorker(handler: (job: any) => Promise<void>) {

  running = true

  while (running) {

    const job = dequeue()

    if (!job) {
      await sleep(500)
      continue
    }

    let attempts = 0
    activeJobId = job.id

    while (attempts < MAX_ATTEMPTS) {

      try {

        await handler(job)
        processedJobs++
        activeJobId = null

        break

      } catch (err) {

        attempts++
        retryCount++

        if (attempts >= MAX_ATTEMPTS) {
          console.error("JOB FAILED", job.id)
          failedJobs++
          activeJobId = null
        }

      }

    }

  }

}

export function stopWorker() {
  running = false
}

export function getWorkerMetrics() {
  return {
    running,
    activeJobId,
    processedJobs,
    failedJobs,
    retryCount
  }
}

export function resetWorkerMetricsForTests() {
  activeJobId = null
  processedJobs = 0
  failedJobs = 0
  retryCount = 0
  running = false
}
