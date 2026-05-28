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
  it("shallow /health stays 200 (liveness) but deep /health?deep=1 returns 503 when required env is missing", async () => {
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

    async function getCode(path: string): Promise<number> {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("bad address");
      return new Promise<number>((resolve, reject) => {
        const req = http.get({ hostname: "127.0.0.1", port: address.port, path }, (res) => {
          res.on("data", () => {});
          res.on("end", () => resolve(res.statusCode ?? 0));
        });
        req.on("error", reject);
      });
    }

    try {
      expect(await getCode("/health")).toBe(200);
      expect(await getCode("/health?deep=1")).toBe(503);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      process.env = prev;
    }
  });
});
