import { runJobHandler } from "../jobs";
import { dequeue, requeue, queueLength, type Job } from "./jobQueue";
import { logJobComplete, logJobFailure, logJobStarted } from "./jobLogger";

const MAX_ATTEMPTS = 3;
let workerRunning = true;
let activeWorkers = 0;

async function runJob(job: Job): Promise<void> {
  await runJobHandler(job.type, job.payload);
}

function logJob(status: "completed" | "failed", job: Job, err?: unknown): void {
  if (status === "completed") {
    logJobComplete(job);
    return;
  }

  logJobFailure(job, err);
}

export async function workerLoop() {
  while (workerRunning) {
    const job = dequeue();

    if (!job) {
      await new Promise((r) => setTimeout(r, 500));
      continue;
    }

    activeWorkers += 1;
    if (job.attempts === 0) {
      logJobStarted(job);
    }

    try {
      await runJob(job);

      logJob("completed", job);
    } catch (err) {
      job.attempts++;

      if (job.attempts < MAX_ATTEMPTS) {
        requeue(job);
      } else {
        logJob("failed", job, err);
      }
    } finally {
      activeWorkers -= 1;
    }
  }
}

export function startWorker({ concurrency = 1 }: { concurrency?: number } = {}): void {
  workerRunning = true;

  for (let i = 0; i < concurrency; i++) {
    void workerLoop();
  }
}

export function stopWorker(): void {
  workerRunning = false;
}

export function getWorkerStats(): { active_workers: number; worker_running: boolean; queue_length: number } {
  return {
    active_workers: activeWorkers,
    worker_running: workerRunning,
    queue_length: queueLength()
  };
}
