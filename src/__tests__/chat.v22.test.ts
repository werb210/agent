import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { request as httpRequest } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { createApp } from "../app.js";

function postJson(url: URL, payload: unknown): Promise<{ status: number; body: any }> {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify(payload ?? {});
    const req = httpRequest({ hostname: url.hostname, port: url.port, path: url.pathname, method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (res) => {
      let raw = "";
      res.on("data", (c) => { raw += c; });
      res.on("end", () => resolve({ status: res.statusCode ?? 0, body: raw ? JSON.parse(raw) : {} }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

describe("AGENT_BLOCK_v22_LLM_ERROR_LOGGING_v1", () => {
  let server: Server;
  let baseUrl = "";

  beforeAll(async () => {
    process.env.OPENAI_API_KEY = "test-key";
    process.env.JWT_SECRET = "test-secret";
    process.env.SERVER_URL = "https://example.com";
    const { app } = createApp();
    server = app.listen(0);
    await new Promise<void>((resolve) => server.once("listening", () => resolve()));
    baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn(async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      if (url.includes("api.openai.com")) throw new Error("simulated openai failure");
      if (url.endsWith("/api/maya/escalate")) return new Response(JSON.stringify({ ok: true }), { status: 200 });
      throw new Error(`Unexpected URL: ${url}`);
    }));
  });

  afterAll(async () => {
    vi.unstubAllGlobals();
    await new Promise<void>((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
  });

  it("logs error before graceful degradation handoff", async () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    const response = await postJson(new URL("/api/maya/message", baseUrl), { message: "You there?" });

    expect(response.status).toBe(200);
    expect(response.body.fallback).toBe("human_failover");
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("maya_llm_call_failed"));
    errSpy.mockRestore();
  });
});
