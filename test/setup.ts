import { saveToken } from "../src/services/token.js";

vi.mock("../src/brain/openaiClient", () => ({
  runAI: vi.fn(),
}));

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

beforeAll(() => {
  process.env.TEST_TOKEN = process.env.TEST_TOKEN || "test-token";
  const token = process.env.TEST_TOKEN;

  if (!token) {
    throw new Error("[TEST BLOCKED] MISSING TEST_TOKEN");
  }

  saveToken(token);
});

beforeEach(() => {
  const { runAI } = require("../src/brain/openaiClient");
  runAI.mockReset();
});
