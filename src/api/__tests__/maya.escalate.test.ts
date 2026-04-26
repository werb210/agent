import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { request as httpRequest } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";

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
          resolve({
            status: res.statusCode ?? 0,
            body: raw ? JSON.parse(raw) : {},
          });
        });
      },
    );

    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

describe("Maya BF-Server persistence paths", () => {
  const fetchMock = vi.fn();
  let server: Server;
  let baseUrl = "";

  beforeEach(async () => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    process.env.SERVER_URL = "https://server.boreal.financial";
    process.env.JWT_SECRET = "test-jwt-secret-min-10";

    const { mayaRouter } = await import("../maya.js");
    const app = express();
    app.use(express.json());
    app.use(mayaRouter);

    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", resolve));
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
  });

  afterEach(async () => {
    vi.restoreAllMocks();
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("POST /maya/escalate calls BF-Server at /api/maya/escalations (NOT /api/chat/escalate)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok", data: { id: "abc", deduped: false } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await postJson(new URL("/maya/escalate", baseUrl), {
      reason: "user_requested_human",
      sessionId: "sess-1",
      surface: "client_app",
    });

    expect(response.status).toBe(200);
    expect(response.body?.persisted).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/maya/escalations");
    expect(calledUrl).not.toContain("/api/chat/escalate");
  });

  it("POST /maya/issue calls BF-Server at /api/client/issues (NOT /api/issues)", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ status: "ok", data: { id: "iss-1", received: true } }), {
        status: 201,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await postJson(new URL("/maya/issue", baseUrl), {
      message: "test issue",
      sessionId: "sess-1",
    });

    expect(response.status).toBe(200);
    expect(response.body?.persisted).toBe(true);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/client/issues");
    expect(calledUrl).not.toMatch(/\/api\/issues(?!\/)/);
  });

  it("returns 200 with persisted=false when BF-Server 404s, doesn't crash the user-facing call", async () => {
    fetchMock.mockResolvedValueOnce(new Response("not found", { status: 404 }));

    const response = await postJson(new URL("/maya/escalate", baseUrl), {
      reason: "low_confidence",
      sessionId: "sess-2",
    });

    expect(response.status).toBe(200);
    expect(response.body?.persisted).toBe(false);
  });
});
