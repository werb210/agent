import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { request as httpRequest } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../app.js";

type JsonResponse = { status: number; body: any };

function postJson(url: URL, payload: unknown): Promise<JsonResponse> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload ?? {});
    const req = httpRequest(
      {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode ?? 0, body: raw ? JSON.parse(raw) : {} });
          } catch (error) {
            reject(error);
          }
        });
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

describe("maya public routes", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
    delete process.env.OPENAI_API_KEY;

    const { app } = createApp();
    server = app.listen(0);

    await new Promise<void>((resolve) => {
      server.once("listening", () => resolve());
    });

    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

        if (url.endsWith("/api/chat/escalate")) {
          return new Response(JSON.stringify({ ok: true, sessionId: "session_mock" }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        if (url.endsWith("/api/issues")) {
          return new Response(JSON.stringify({ ok: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          });
        }

        throw new Error(`Unexpected network call in test: ${url}`);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("POST /api/maya/message returns a reply payload", async () => {
    const response = await postJson(new URL("/api/maya/message", baseUrl), { message: "hello" });

    expect(response.status).toBe(503);
    expect(response.body).toEqual(
      expect.objectContaining({
        reply: null,
        error: "openai_not_configured",
      }),
    );
  });

  it("POST /maya/escalate returns successful escalation payload", async () => {
    const response = await postJson(new URL("/maya/escalate", baseUrl), { reason: "help", sessionId: "session-1" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, persisted: true }));
  });

  it("POST /maya/issue returns ok", async () => {
    const response = await postJson(new URL("/maya/issue", baseUrl), { message: "route failed", sessionId: "session-1" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ ok: true, persisted: true }));
  });

  it("POST /maya/escalate returns persisted=false when BF-Server is unreachable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
        if (url.endsWith("/api/chat/escalate")) {
          throw new Error("BF-Server unavailable");
        }
        if (url.endsWith("/api/issues")) {
          return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { "Content-Type": "application/json" } });
        }
        throw new Error(`Unexpected network call in test: ${url}`);
      }),
    );

    const response = await postJson(new URL("/maya/escalate", baseUrl), { reason: "help", sessionId: "session-1" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ ok: true, persisted: false });
  });
});
