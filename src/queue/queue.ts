import crypto from "crypto";
import { enqueue, dequeue, queueLength, snapshot, resetQueue, type Job } from "./jobQueue.js";

export type { Job };

export function enqueueJob(input: Omit<Job, "id" | "createdAt"> & Partial<Pick<Job, "id" | "createdAt">>): Job | null {
  const job: Job = {
    id: input.id ?? crypto.randomUUID(),
    type: input.type,
    payload: input.payload,
    createdAt: input.createdAt ?? Date.now()
  };

  const before = queueLength();
  enqueue(job);

  return queueLength() > before ? job : null;
}

export function dequeueJob(): Job | undefined {
  return dequeue();
}

export function requeueJob(job: Job): void {
  enqueue(job);
}

export function getQueueLength(): number {
  return queueLength();
}

export function getQueueSnapshot(): Job[] {
  return snapshot();
}

export function resetQueueForTests(): void {
  resetQueue();
}
