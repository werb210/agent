import { runJobHandler } from "../jobs";
import { dequeueJob, getQueueLength, requeueJob, type Job } from "./queue";
import { logJobComplete, logJobFailure, logJobStarted } from "./jobLogger";

let activeWorkers = 0;
let workerRunning = false;
let loopTimer: NodeJS.Timeout | null = null;

async function runJob(job: Job): Promise<void> {
  await runJobHandler(job.type, job.payload);
}

async function workOnce(): Promise<void> {
  const job = dequeueJob();
  if (!job) {
    return;
  }

  activeWorkers += 1;

  if (job.attempts === 0) {
    logJobStarted(job);
  }

  try {
    await runJob(job);
    logJobComplete(job);
  } catch (err) {
    job.attempts += 1;

    if (job.attempts < 3) {
      requeueJob(job);
    } else {
      logJobFailure(job, err);
    }
  } finally {
    activeWorkers -= 1;
  }
}

export function startWorker({ concurrency = 1 }: { concurrency?: number } = {}): void {
  if (workerRunning) {
    return;
  }

  workerRunning = true;

  const loop = async () => {
    if (!workerRunning) {
      return;
    }

    const pending = getQueueLength();
    const available = Math.max(0, concurrency - activeWorkers);

    if (pending > 0 && available > 0) {
      await Promise.all(Array.from({ length: Math.min(pending, available) }, () => workOnce()));
    }

    loopTimer = setTimeout(() => {
      void loop();
    }, 50);
    loopTimer.unref();
  };

  void loop();
}

export function stopWorker(): void {
  workerRunning = false;

  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }
}

export function getWorkerStats(): { active_workers: number; worker_running: boolean } {
  return {
    active_workers: activeWorkers,
    worker_running: workerRunning
  };
}
