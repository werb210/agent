import { afterEach, vi } from "vitest";

process.env.API_URL =
  process.env.API_URL || "http://localhost:3000";

process.env.NODE_ENV = "test";

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
(globalThis as any).jest = vi;
(globalThis as any).jest.requireMock = (path: string) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(path);
};

afterEach(() => {
  vi.clearAllMocks();
});
