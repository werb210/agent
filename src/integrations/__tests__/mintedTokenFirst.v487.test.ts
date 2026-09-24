// AGENT_BLOCK_v487_MINTED_TOKEN_FIRST
import { describe, it, expect, vi, afterEach } from "vitest";
import jwt from "jsonwebtoken";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); vi.resetModules(); });

async function tokenSentFor(path: string): Promise<string> {
  vi.stubEnv("NODE_ENV", "production");
  vi.stubEnv("VITEST", "false");
  vi.stubEnv("SERVER_URL", "https://server.example");
  vi.stubEnv("JWT_SECRET", "secret-v487-test");
  vi.stubEnv("AGENT_API_TOKEN", "stale-pre-minted-token");
  let auth = "";
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: any) => {
    auth = String(init?.headers?.Authorization ?? "");
    return { ok: true, json: async () => ({ status: "ok" }) } as any;
  }));
  const { callBFServer } = await import("../bfServerClient");
  await callBFServer(path, { method: "POST", body: {} });
  return auth.replace(/^Bearer /, "");
}

describe("v487 minted token first", () => {
  it("ignores a stale AGENT_API_TOKEN when JWT_SECRET is set", async () => {
    const token = await tokenSentFor("/api/communications/maya-handoff");
    expect(token).not.toBe("stale-pre-minted-token");
    const decoded = jwt.verify(token, "secret-v487-test") as Record<string, unknown>;
    expect(decoded.role).toBe("Staff");
  });
  it("still mints the service token for /api/maya/ paths", async () => {
    const token = await tokenSentFor("/api/maya/staff/application-summary");
    const decoded = jwt.verify(token, "secret-v487-test") as Record<string, unknown>;
    expect(decoded.kind).toBe("service");
  });
});
