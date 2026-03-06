import crypto from "crypto";
import { enqueue, dequeue, queueLength, requeue, resetQueueForTests, getQueueSnapshot as snapshot, type Job } from "./jobQueue";

export type { Job };

export function enqueueJob(input: Omit<Job, "id" | "attempts" | "createdAt"> & Partial<Pick<Job, "id" | "attempts" | "createdAt">>): Job | null {
  const job: Job = {
    id: input.id ?? crypto.randomUUID(),
    type: input.type,
    entityId: input.entityId,
    payload: input.payload,
    attempts: input.attempts ?? 0,
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
  requeue(job);
}

export function getQueueLength(): number {
  return queueLength();
}

export function getQueueSnapshot(): Job[] {
  return snapshot();
}

export function resetQueue(): void {
  resetQueueForTests();
}
