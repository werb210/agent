const seen: Map<string, number> = new Map()

const WINDOW = 30000

export function shouldEnqueue(key: string) {

  const now = Date.now()

  const last = seen.get(key)

  if (last && now - last < WINDOW) {
    return false
  }

  seen.set(key, now)

  return true
}
