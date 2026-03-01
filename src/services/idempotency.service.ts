const processed = new Map<string, number>();

const TTL = 5 * 60 * 1000;

export function isDuplicate(id: string): boolean {
  const now = Date.now();

  if (processed.has(id)) {
    return true;
  }

  processed.set(id, now);

  for (const [key, ts] of processed.entries()) {
    if (now - ts > TTL) {
      processed.delete(key);
    }
  }

  return false;
}

export function clearProcessedIds() {
  processed.clear();
}
