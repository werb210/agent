import { describe, expect, it, vi } from "vitest";
import { createApp } from "../app.js";
import { validateEnv } from "../startup/validateEnv.js";
import type { RuntimeDependencies } from "../dependencies/types.js";
import http from "http";

function buildDeps(): RuntimeDependencies {
  const ok = async () => "ok" as const;
  return {
    db: { status: ok },
    redis: { status: ok },
    openai: { status: ok },
    twilio: { status: ok },
    externalApi: { status: ok },
    initAll: async () => undefined,
    closeAll: async () => undefined,
  };
}

async function fetchHealth(status: ReturnType<typeof validateEnv>, path = "/health") {
  const previousCiValidate = process.env.CI_VALIDATE;
  process.env.CI_VALIDATE = "false";
  const { app } = createApp({ envStatus: status, deps: buildDeps() });
  const server = await new Promise<import("http").Server>((resolve) => {
    const listening = app.listen(0, () => resolve(listening));
  });

  try {
    const address = server.address();
    if (!address || typeof address === "string") {
      throw new Error("Expected ephemeral server address");
    }

    const response = await new Promise<{ code: number; body: Record<string, unknown> }>((resolve, reject) => {
      const req = http.get(
        {
          hostname: "127.0.0.1",
          port: address.port,
          path,
        },
        (res) => {
          let raw = "";
          res.setEncoding("utf8");
          res.on("data", (chunk) => {
            raw += chunk;
          });
          res.on("end", () => {
            resolve({
              code: res.statusCode ?? 0,
              body: JSON.parse(raw) as Record<string, unknown>,
            });
          });
        },
      );
      req.on("error", reject);
    });

    return response;
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    if (previousCiValidate === undefined) {
      delete process.env.CI_VALIDATE;
    } else {
      process.env.CI_VALIDATE = previousCiValidate;
    }
  }
}

describe("startup env hardening", () => {
  it("does not throw in production when AGENT_SHARED_SECRET is missing", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(() =>
      validateEnv({
        NODE_ENV: "production",
        PORT: "8080",
        SERVER_URL: "https://example.com",
        JWT_SECRET: "jwt-secret",
        OPENAI_API_KEY: "openai-key",
        TWILIO_ACCOUNT_SID: "sid",
        TWILIO_AUTH_TOKEN: "token",
        TWILIO_PHONE_NUMBER: "+15555555555",
      } as any),
    ).not.toThrow();
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("AGENT_SHARED_SECRET is not set"));
    warnSpy.mockRestore();
  });

  it("returns 200 degraded from /health when OPENAI_API_KEY is missing", async () => {
    const status = validateEnv({
      NODE_ENV: "test",
      PORT: "8080",
      SERVER_URL: "https://example.com",
      JWT_SECRET: "jwt-secret",
    } as any);

    const res = await fetchHealth(status);
    expect(res.code).toBe(200);
    expect(res.body.status).toBe("degraded");
  });

  it("returns 200 ok from /health when required vars are present", async () => {
    const status = validateEnv({
      NODE_ENV: "test",
      PORT: "8080",
      SERVER_URL: "https://example.com",
      JWT_SECRET: "jwt-secret",
      OPENAI_API_KEY: "openai-key",
    } as any);

    const res = await fetchHealth(status);
    expect(res.code).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("returns 503 from /health?deep=1 when OPENAI_API_KEY is missing", async () => {
    const status = validateEnv({
      NODE_ENV: "test",
      PORT: "8080",
      SERVER_URL: "https://example.com",
      JWT_SECRET: "jwt-secret",
    } as any);

    const res = await fetchHealth(status, "/health?deep=1");
    expect(res.code).toBe(503);
    expect(res.body.reason).toBe("openai_not_configured");
  });
});
