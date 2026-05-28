import { describe, expect, it, afterEach } from "vitest";
import http from "http";
import { createApp } from "../app.js";
import type { RuntimeDependencies } from "../dependencies/types.js";

function buildDeps(): RuntimeDependencies {
  const ok = async () => "ok" as const;
  return {
    db: { status: ok }, redis: { status: ok }, openai: { status: ok },
    twilio: { status: ok }, externalApi: { status: ok },
    initAll: async () => undefined, closeAll: async () => undefined,
  };
}

const VALID_ENV_STATUS = {
  valid: true, missingRequired: [] as string[], missingOptional: [] as string[],
  mode: "valid" as const, values: { port: 8080 },
};

async function getWithOrigin(origin: string | null): Promise<{ code: number; acao: string | undefined }> {
  const { app } = createApp({ envStatus: VALID_ENV_STATUS, deps: buildDeps() });
  const server = await new Promise<import("http").Server>((resolve) => {
    const s = app.listen(0, () => resolve(s));
  });
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("no address");
    return await new Promise((resolve, reject) => {
      const req = http.get(
        { hostname: "127.0.0.1", port: address.port, path: "/health", headers: origin ? { Origin: origin } : {} },
        (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve({ code: res.statusCode ?? 0, acao: res.headers["access-control-allow-origin"] as string | undefined }));
        },
      );
      req.on("error", reject);
    });
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
}

describe("CORS fail-closed in production (v317)", () => {
  const prev = { node: process.env.NODE_ENV, cors: process.env.CORS_ALLOWED_ORIGINS };
  afterEach(() => {
    process.env.NODE_ENV = prev.node;
    if (prev.cors === undefined) delete process.env.CORS_ALLOWED_ORIGINS;
    else process.env.CORS_ALLOWED_ORIGINS = prev.cors;
  });

  it("denies an arbitrary origin (403) when CORS_ALLOWED_ORIGINS is unset in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CORS_ALLOWED_ORIGINS;
    const res = await getWithOrigin("https://evil.example.com");
    expect(res.code).toBe(403);
  });

  it("allows a known Boreal default origin when CORS_ALLOWED_ORIGINS is unset in production", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CORS_ALLOWED_ORIGINS;
    const res = await getWithOrigin("https://www.boreal.financial");
    expect(res.code).toBe(200);
    expect(res.acao).toBe("https://www.boreal.financial");
  });

  it("an explicit CORS_ALLOWED_ORIGINS takes precedence over the defaults", async () => {
    process.env.NODE_ENV = "production";
    process.env.CORS_ALLOWED_ORIGINS = "https://partner.example.com";
    const allowed = await getWithOrigin("https://partner.example.com");
    expect(allowed.code).toBe(200);
    expect(allowed.acao).toBe("https://partner.example.com");
    const denied = await getWithOrigin("https://www.boreal.financial");
    expect(denied.code).toBe(403);
  });

  it("requests with no Origin header (server-to-server, health probes) are allowed", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.CORS_ALLOWED_ORIGINS;
    const res = await getWithOrigin(null);
    expect(res.code).toBe(200);
  });
});
