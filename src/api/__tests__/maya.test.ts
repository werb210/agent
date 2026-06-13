import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { request as httpRequest } from "node:http";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import express from "express";
import { mayaRouter } from "../maya.js";

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

describe("maya API message route", () => {
  let server: Server;
  let baseUrl = "";

  beforeEach(async () => {
    process.env.JWT_SECRET = "test-secret";
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
    delete process.env.OPENAI_API_KEY;
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("returns 200 with canned reply when OPENAI_API_KEY is unset", async () => {
    // AGENT_BLOCK_v3_MAYA_GRACEFUL_FALLBACK_v1 — the agent now answers
    // basic queries even when OpenAI is unreachable. Visitors get a
    // canned response keyed off the message content, with a fallback
    // marker so callers can tell this came from the no-key path.
    delete process.env.OPENAI_API_KEY;

    const response = await postJson(new URL("/api/maya/message", baseUrl), { message: "hello" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(
      expect.objectContaining({
        reply: expect.any(String),
        fallback: "no_openai_key",
      }),
    );
    expect((response.body as { reply: string }).reply.length).toBeGreaterThan(0);
  });

  it("returns 200 with reply when OpenAI returns a valid completion", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    // Return a FRESH Response per call: the handler now makes several
    // fetches per turn (knowledge retrieval + persona + OpenAI), and a
    // Response body can only be read once.
    vi.spyOn(global, "fetch").mockImplementation(async () =>
      new Response(
        JSON.stringify({
          choices: [{ message: { content: "Hello from Maya" } }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );

    const response = await postJson(new URL("/api/maya/message", baseUrl), { message: "hello" });

    expect(response.status).toBe(200);
    expect(response.body).toEqual(expect.objectContaining({ reply: "Hello from Maya" }));
  });
});
