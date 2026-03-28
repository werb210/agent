const MAX_RETRIES = 3;

export async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let i = 0; i < MAX_RETRIES; i += 1) {
    try {
      return await fn();
    } catch (e) {
      if (i === MAX_RETRIES - 1) {
        throw e;
      }
    }
  }

  throw new Error("Retry execution exhausted unexpectedly");
}
