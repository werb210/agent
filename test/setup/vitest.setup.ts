import { vi } from "vitest"

// JEST COMPAT
;(globalThis as any).jest = vi

// FETCH MOCK DEFAULT
globalThis.fetch = vi.fn(async () => ({
  ok: true,
  status: 200,
  json: async () => ({ ok: true, approval_probability: 0.5 }),
  text: async () => "",
})) as any

// STORAGE MOCK (fix AUTH BLOCK)
class MemoryStorage {
  store = new Map<string, string>()
  getItem(k: string) { return this.store.get(k) ?? null }
  setItem(k: string, v: string) { this.store.set(k, v) }
  removeItem(k: string) { this.store.delete(k) }
}

;(globalThis as any).localStorage = (globalThis as any).localStorage ?? new MemoryStorage()
;(globalThis as any).window = (globalThis as any).window ?? { location: { href: "" } }
if (!(globalThis as any).window.location) {
  ;(globalThis as any).window.location = { href: "" }
}

// ENV DEFAULTS
process.env.API_URL = process.env.API_URL || "http://localhost:3000"

// SILENCE MAX LISTENERS
process.setMaxListeners(50)
