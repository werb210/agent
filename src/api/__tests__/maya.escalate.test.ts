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

  // AGENT_BLOCK_v329_MAYA_FAILSAFE_TESTS_v1 — v328 rewired this from the
  // legacy /api/maya/escalations to the canonical kind-discriminated
  // /api/maya/escalate (which fires staff SMS via v222).
  it("POST /maya/escalate calls BF-Server at /api/maya/escalate with kind=talk_to_human", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, conversation_id: "conv-1" }), {
        status: 200,
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
    expect(response.body?.conversation_id).toBe("conv-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/maya/escalate");
    expect(calledUrl).not.toContain("/api/maya/escalations");
    expect(calledUrl).not.toContain("/api/chat/escalate");

    const sentBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body ?? "{}"));
    expect(sentBody.kind).toBe("talk_to_human");
    expect(typeof sentBody.message).toBe("string");
    expect(sentBody.message.length).toBeGreaterThan(0);
  });

  // AGENT_BLOCK_v329_MAYA_FAILSAFE_TESTS_v1 — v328 rewired this from the
  // legacy /api/client/issues to the canonical /api/maya/escalate with
  // kind=report_issue.
  it("POST /maya/issue calls BF-Server at /api/maya/escalate with kind=report_issue", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true, issue_id: "iss-1" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    );

    const response = await postJson(new URL("/maya/issue", baseUrl), {
      message: "test issue",
      sessionId: "sess-1",
    });

    expect(response.status).toBe(200);
    expect(response.body?.persisted).toBe(true);
    expect(response.body?.issue_id).toBe("iss-1");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const calledUrl = String(fetchMock.mock.calls[0][0]);
    expect(calledUrl).toContain("/api/maya/escalate");
    expect(calledUrl).not.toContain("/api/client/issues");

    const sentBody = JSON.parse(String(fetchMock.mock.calls[0][1]?.body ?? "{}"));
    expect(sentBody.kind).toBe("report_issue");
    expect(sentBody.description).toBe("test issue");
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
