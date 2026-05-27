import { describe, expect, it } from "vitest";
import http from "node:http";
import { createApp } from "../app.js";
import type { RuntimeDependencies } from "../dependencies/types.js";

function buildDeps(): RuntimeDependencies {
  const ok = async () => "ok" as const;
  return {
    db: { status: ok }, redis: { status: ok }, openai: { status: ok }, twilio: { status: ok }, externalApi: { status: ok },
    initAll: async () => undefined, closeAll: async () => undefined,
  };
}

describe("AGENT_BLOCK_v21_HEALTHCHECK_REAL_v1", () => {
  it("returns 503 when required env vars are missing", async () => {
    const prev = { ...process.env };
    delete process.env.OPENAI_API_KEY;
    delete process.env.SERVER_URL;
    delete process.env.JWT_SECRET;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.MAYA_HANDOFF_TO;

    const { app } = createApp({ deps: buildDeps() });
    const server = await new Promise<import("node:http").Server>((resolve) => {
      const listening = app.listen(0, () => resolve(listening));
    });

    try {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("bad address");
      const response = await new Promise<{ code: number }>((resolve, reject) => {
        const req = http.get({ hostname: "127.0.0.1", port: address.port, path: "/health" }, (res) => {
          resolve({ code: res.statusCode ?? 0 });
        });
        req.on("error", reject);
      });
      expect(response.code).toBe(503);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      process.env = prev;
    }
  });
});
