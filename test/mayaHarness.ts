// AGENT_v789 test harness: mounts the real Maya router (or the whole app) and posts to it
// over node:http (the shared setup fakes a browser window, which breaks fetch reads of a
// local server). The global fetch is the strict BF-Server fake; pass openai to script the model.
import express from "express";
import http from "node:http";
import type { AddressInfo } from "node:net";
import { createBfServerFake, openaiScript, type FakeHandler } from "./bfServerFake.js";
import { mayaContext } from "./mayaContext.js";

export type Started = { base: string; close: () => Promise<void> };

export async function listen(app: express.Express): Promise<Started> {
  const server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", () => r()));
  const base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  return { base, close: () => new Promise<void>((r) => server.close(() => r())) };
}

export async function startMayaRouter(): Promise<Started> {
  const { mayaRouter } = await import("../src/api/maya.js");
  const app = express();
  app.use(express.json());
  app.use(mayaRouter);
  return listen(app);
}

export function post(base: string, path: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; body: any }> {
  const data = JSON.stringify(body ?? {});
  return new Promise((resolve, reject) => {
    const req = http.request(base + path, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": String(Buffer.byteLength(data)), ...headers } }, (res) => {
      let t = "";
      res.setEncoding("utf8");
      res.on("data", (c) => { t += c; });
      res.on("end", () => { try { resolve({ status: res.statusCode ?? 0, body: t ? JSON.parse(t) : {} }); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
    req.end(data);
  });
}

/** Script the model, install the strict fake, and ask Maya as the given verified caller. */
export async function ask(base: string, body: Record<string, unknown>, claims: Record<string, unknown>, script: Array<Record<string, unknown>>, overrides: Record<string, unknown | FakeHandler> = {}) {
  const openai = openaiScript(script);
  const fake = createBfServerFake({ openai, overrides });
  globalThis.fetch = fake.fetch;
  const r = await post(base, "/api/maya/message", body, { "x-maya-context": mayaContext(claims) });
  return { status: r.status, body: r.body, openai: openai.bodies, calls: fake.calls, system: String(openai.bodies[0]?.messages?.[0]?.content ?? "") };
}

export const toolCall = (id: string, name: string, args: Record<string, unknown> = {}) => ({
  role: "assistant",
  content: null,
  tool_calls: [{ id, type: "function", function: { name: name.replace(/[^a-zA-Z0-9_-]/g, "_"), arguments: JSON.stringify(args) } }],
});
