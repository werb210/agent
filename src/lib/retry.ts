function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const cappedAttempts = Math.min(maxAttempts, 3);
  let lastError: unknown;

  for (let attempt = 1; attempt <= cappedAttempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (attempt === cappedAttempts) {
        break;
      }

      const backoffMs = 250 * 2 ** (attempt - 1);
      await sleep(backoffMs);
    }
  }

  throw lastError;
}
