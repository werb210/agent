import { afterEach, beforeEach, vi } from "vitest";

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

const storage = new MemoryStorage();

(globalThis as any).localStorage = storage;
(globalThis as any).window = {
  location: {
    href: ""
  },
  addEventListener: vi.fn()
};
(globalThis as any).jest = vi;
(globalThis as any).jest.requireMock = (path: string) => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require(path);
};

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.clearAllMocks();
});
