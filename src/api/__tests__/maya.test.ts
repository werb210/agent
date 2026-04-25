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

  it("returns 503 when OPENAI_API_KEY is unset", async () => {
    delete process.env.OPENAI_API_KEY;

    const response = await postJson(new URL("/api/maya/message", baseUrl), { message: "hello" });

    expect(response.status).toBe(503);
    expect(response.body).toEqual(
      expect.objectContaining({
        reply: null,
        error: "openai_not_configured",
      }),
    );
  });

  it("returns 200 with reply when OpenAI returns a valid completion", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    vi.spyOn(global, "fetch").mockResolvedValue(
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
