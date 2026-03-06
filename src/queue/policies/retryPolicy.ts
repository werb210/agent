export interface RetryPolicy {
  maxAttempts: number;
  backoffMs: number;
}

export const defaultRetryPolicy: RetryPolicy = {
  maxAttempts: 3,
  backoffMs: 2000
};

export function shouldRetry(attempt: number, policy: RetryPolicy = defaultRetryPolicy): boolean {
  return attempt < policy.maxAttempts;
}
