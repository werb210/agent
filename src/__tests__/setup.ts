import { afterEach, beforeEach, vi } from "vitest";

process.env.NODE_ENV = "test";
process.env.API_URL = "http://localhost:3000";

class MemoryStorage {
  private readonly map = new Map<string, string>();

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}

(globalThis as any).localStorage = (globalThis as any).localStorage || new MemoryStorage();
(globalThis as any).window = (globalThis as any).window || {
  location: { href: "" },
  addEventListener: vi.fn(),
};

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      json: async () => ({ status: "ok", data: [] }),
    }))
  );
});

afterEach(() => {
  vi.clearAllMocks();
});
