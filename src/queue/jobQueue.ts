import { runJobHandler } from "../jobs";
import { logJobCompleted, logJobFailed, logJobStarted } from "../services/jobLogger";

export type Job = {
  id: string;
  type: string;
  payload: any;
  entityId?: string;
};

const queue: Job[] = [];
let running = false;
const workers = 1;
const recentJobs = new Map<string, number>();
const DEDUPE_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 3;

function dedupeKey(job: Job): string {
  return `${job.type}:${job.entityId ?? job.payload?.id ?? "unknown"}`;
}

function isDuplicateJob(job: Job): boolean {
  const key = dedupeKey(job);
  const now = Date.now();
  const previous = recentJobs.get(key);

  if (previous && now - previous < DEDUPE_WINDOW_MS) {
    return true;
  }

  recentJobs.set(key, now);
  return false;
}

export async function enqueue(job: Job): Promise<void> {
  if (isDuplicateJob(job)) {
    return;
  }

  queue.push(job);
  if (!running) {
    void processQueue();
  }
}

async function executeJob(job: Job, attempt = 1): Promise<void> {
  if (attempt === 1) {
    logJobStarted(job.id, job.type);
  }

  try {
    await runJobHandler(job.type, job.payload);
    logJobCompleted(job.id);
  } catch (err) {
    if (attempt < MAX_ATTEMPTS) {
      await new Promise((resolve) => {
        setTimeout(resolve, 1000 * attempt);
      });
      await executeJob(job, attempt + 1);
      return;
    }

    console.error("Job permanently failed", job.id, err);
    logJobFailed(job.id, err);
  }
}

async function processQueue(): Promise<void> {
  running = true;

  while (queue.length > 0) {
    const job = queue.shift();
    if (!job) {
      continue;
    }

    try {
      await executeJob(job);
    } catch (err) {
      console.error("Maya job failed", err);
    }
  }

  running = false;
}

export function getQueueStats() {
  return {
    queue_length: queue.length,
    workers,
    running
  };
}

export function resetQueueForTests(): void {
  queue.length = 0;
  running = false;
  recentJobs.clear();
}
