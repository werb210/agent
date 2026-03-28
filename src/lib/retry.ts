const MAX_RETRIES = 3;
const BASE_DELAY = 100;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < MAX_RETRIES; i += 1) {
    try {
      return await fn();
    } catch (e) {
      if (i === MAX_RETRIES - 1) {
        throw e;
      }

      await sleep(BASE_DELAY * (i + 1));
    }
  }

  throw new Error("Retry execution exhausted unexpectedly");
}
