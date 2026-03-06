import { dequeue, enqueue, queueLength } from "./jobQueue"
import { runJobHandler } from "../jobs"
import { logJobComplete, logJobFailure, logJobStarted } from "./jobLogger"

const MAX_ATTEMPTS = 3
let workerRunning = true
let activeWorkers = 0

export async function workerLoop() {
  while (workerRunning) {
    const job = dequeue()

    if (!job) {
      await new Promise(r => setTimeout(r, 500))
      continue
    }

    activeWorkers += 1
    if (job.attempts === 0) {
      logJobStarted(job)
    }

    try {
      await runJobHandler(job.type, job.payload)
      logJobComplete(job)
    } catch (err) {
      job.attempts++

      if (job.attempts < MAX_ATTEMPTS) {
        console.warn("Retrying job", job.id)
        enqueue(job)
      } else {
        console.error("Job failed permanently", job.id)
        logJobFailure(job, err)
      }
    } finally {
      activeWorkers -= 1
    }
  }
}

export function startWorker({ concurrency = 1 }: { concurrency?: number } = {}): void {
  workerRunning = true

  for (let i = 0; i < concurrency; i++) {
    void workerLoop()
  }
}

export function stopWorker(): void {
  workerRunning = false
}

export function getWorkerStats(): { active_workers: number; worker_running: boolean; queue_length: number } {
  return {
    active_workers: activeWorkers,
    worker_running: workerRunning,
    queue_length: queueLength()
  }
}
