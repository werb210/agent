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
  }
};

process.env.TEST_TOKEN = process.env.TEST_TOKEN || "test-token";
