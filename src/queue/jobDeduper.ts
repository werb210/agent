const recentJobs = new Map<string, number>();
const DEDUPE_WINDOW_MS = 30_000;

export function shouldEnqueue(jobType: string, entityId?: string): boolean {
  if (!entityId) {
    return true;
  }

  const key = `${jobType}:${entityId}`;
  const last = recentJobs.get(key);

  if (last && Date.now() - last < DEDUPE_WINDOW_MS) {
    return false;
  }

  recentJobs.set(key, Date.now());
  return true;
}

export function clearRecentJobs(): void {
  recentJobs.clear();
}
