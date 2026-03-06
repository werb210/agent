import crypto from "crypto";
import { shouldEnqueue } from "./jobDeduper";

export interface Job {
  id: string;
  type: string;
  entityId?: string;
  payload: unknown;
  attempts: number;
  createdAt: number;
}

const queue: Job[] = [];

export function enqueueJob(input: Omit<Job, "id" | "attempts" | "createdAt"> & Partial<Pick<Job, "id" | "attempts" | "createdAt">>): Job | null {
  if (!shouldEnqueue(input.type, input.entityId)) {
    return null;
  }

  const job: Job = {
    id: input.id ?? crypto.randomUUID(),
    type: input.type,
    entityId: input.entityId,
    payload: input.payload,
    attempts: input.attempts ?? 0,
    createdAt: input.createdAt ?? Date.now()
  };

  queue.push(job);
  return job;
}

export function dequeueJob(): Job | undefined {
  return queue.shift();
}

export function requeueJob(job: Job): void {
  queue.push(job);
}

export function getQueueLength(): number {
  return queue.length;
}

export function getQueueSnapshot(): Job[] {
  return [...queue];
}

export function resetQueue(): void {
  queue.length = 0;
}
