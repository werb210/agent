export const recentJobs = new Map<string, number>();

export function isDuplicate(jobType: string, entityId?: string) {
  if (!entityId) return false;

  const key = `${jobType}:${entityId}`;
  const now = Date.now();

  const last = recentJobs.get(key);

  if (last && now - last < 30000) {
    return true;
  }

  recentJobs.set(key, now);
  return false;
}

export function clearRecentJobs(): void {
  recentJobs.clear();
}

export function shouldEnqueue(jobType: string, entityId?: string): boolean {
  return !isDuplicate(jobType, entityId);
}
