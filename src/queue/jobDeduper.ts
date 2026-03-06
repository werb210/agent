const recentJobs = new Map<string, number>()

const DEDUPE_WINDOW = 30000

function toKey(jobTypeOrKey: string, entityId?: string): string {
  return entityId ? `${jobTypeOrKey}:${entityId}` : jobTypeOrKey
}

export function shouldEnqueue(jobTypeOrKey: string, entityId?: string): boolean {
  const key = toKey(jobTypeOrKey, entityId)
  const now = Date.now()

  if (recentJobs.has(key)) {
    const last = recentJobs.get(key)!
    if (now - last < DEDUPE_WINDOW) {
      return false
    }
  }

  recentJobs.set(key, now)
  return true
}

export function clearRecentJobs(): void {
  recentJobs.clear()
}
