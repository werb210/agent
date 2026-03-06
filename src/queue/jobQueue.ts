import { isDuplicate, clearRecentJobs } from "./jobDeduper";
import { clearJobLogs } from "./jobLogger";

export interface Job {
  id: string;
  type: string;
  entityId?: string;
  payload: any;
  attempts: number;
  createdAt: number;
}

const queue: Job[] = [];

export function enqueue(job: Job) {
  if (isDuplicate(job.type, job.entityId)) {
    return;
  }

  queue.push(job);
}

export function requeue(job: Job) {
  queue.push(job);
}

export function dequeue(): Job | undefined {
  return queue.shift();
}

export function queueLength() {
  return queue.length;
}

export function getQueueSnapshot(): Job[] {
  return [...queue];
}

export function getQueueStats() {
  return {
    queue_length: queueLength(),
    workers: 2
  };
}

export function resetQueueForTests(): void {
  queue.length = 0;
  clearRecentJobs();
  clearJobLogs();
}
