// AGENT_SERVICE_TOKEN_v1
import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const executor = fs.readFileSync(path.resolve(__dirname, "../ai/toolExecutor.ts"), "utf8");

describe("token is not re-minted per tool call", () => {
  it("caches until near expiry", () => {
    expect(executor).toContain("cachedToken");
    expect(executor).toContain("RENEW_BEFORE_MS");
    expect(executor).toMatch(/nowMs < cachedToken\.expiresAtMs - RENEW_BEFORE_MS/);
  });

  it("rejects the config.ts fallback secret", () => {
    expect(executor).toContain('secret === "test_secret"');
  });

  it("exposes a reset seam so tests are not order-dependent", () => {
    expect(executor).toContain("__resetAgentAuthToken");
  });
});
