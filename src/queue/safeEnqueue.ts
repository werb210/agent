import { setTimeout as sleep } from "node:timers/promises";
import { enqueueJob, type Job } from "./queue.js";
import { defaultRetryPolicy, shouldRetry, type RetryPolicy } from "./policies/retryPolicy.js";

type EnqueueInput = Omit<Job, "id" | "createdAt"> & Partial<Pick<Job, "id" | "createdAt">>;

export async function safeEnqueue(task: EnqueueInput, policy: RetryPolicy = defaultRetryPolicy): Promise<boolean> {
  let attempt = 0;

  while (true) {
    try {
      const result = enqueueJob(task);
      if (!result) {
        throw new Error("Failed to enqueue task");
      }

      return true;
    } catch (err) {
      attempt += 1;

      if (!shouldRetry(attempt, policy)) {
        throw err;
      }

      await sleep(policy.backoffMs);
    }
  }
}
