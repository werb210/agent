import { vi } from "vitest"
import { createBfServerFake } from "../bfServerFake.js"

// JEST COMPAT
;(globalThis as any).jest = vi

// AGENT_v789_CONTRACT_FIXTURES - the default fetch only knows the real BF-Server paths
// (test/fixtures/bfServer.v789.ts) and fails on anything else.
process.env.SERVER_URL = process.env.SERVER_URL || "https://bf-server.test"
globalThis.fetch = createBfServerFake().fetch

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
