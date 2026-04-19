process.env.NODE_ENV = "test";

process.env.TWILIO_ACCOUNT_SID ||= "test";
process.env.TWILIO_AUTH_TOKEN ||= "test";
process.env.TWILIO_PHONE_NUMBER ||= "test";
process.env.AGENT_API_TOKEN ||= "test-token";

import { beforeEach, vi } from "vitest";

import { resetEnv } from "../config/env.js";

(globalThis as any).jest = vi;

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

global.fetch = vi.fn(async () => {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      status: "ok",
      data: {},
      approval_probability: 0.5,
    }),
  } as any;
});

beforeEach(() => {
  resetEnv();
  vi.restoreAllMocks();
  vi.clearAllMocks();
  vi.unstubAllEnvs();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("API_URL", "http://localhost:3000");
});
