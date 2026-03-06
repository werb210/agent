import { clearRecentJobs } from "./jobDeduper";
import { enqueueJob, getQueueLength, resetQueue, type Job } from "./queue";
import { clearJobLogs } from "./jobLogger";
import { getWorkerStats, startWorker, stopWorker } from "./worker";

let autoWorkerStarted = false;

function ensureWorkerStarted(): void {
  if (autoWorkerStarted) {
    return;
  }

  startWorker({ concurrency: 2 });
  autoWorkerStarted = true;
}

export async function enqueue(job: Omit<Job, "attempts" | "createdAt"> & Partial<Pick<Job, "attempts" | "createdAt">>): Promise<void> {
  ensureWorkerStarted();
  enqueueJob(job);
}

export function getQueueStats() {
  const workerStats = getWorkerStats();

  return {
    queue_length: getQueueLength(),
    active_workers: workerStats.active_workers,
    workers: 2,
    running: workerStats.worker_running
  };
}

export function resetQueueForTests(): void {
  resetQueue();
  clearRecentJobs();
  clearJobLogs();
  stopWorker();
  autoWorkerStarted = false;
}
