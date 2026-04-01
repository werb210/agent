import { setTimeout as sleep } from "node:timers/promises";

const DEFAULT_RETRIES = 3;
const DEFAULT_DELAY_MS = 1000;

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  retries = DEFAULT_RETRIES,
  delay = DEFAULT_DELAY_MS
): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof Error && ["Missing auth token", "Invalid tool payload"].includes(err.message)) {
      throw err;
    }

    if (retries <= 0) {
      throw err;
    }

    await sleep(delay);
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  return retryWithBackoff(fn, DEFAULT_RETRIES - 1, DEFAULT_DELAY_MS);
}
