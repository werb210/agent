// AGENT_v784_MAYA_CONTEXT + AGENT_v784_MAYA_RATE_LIMIT
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import http from "node:http";
import type { AddressInfo } from "node:net";
import jwt from "jsonwebtoken";

process.env.OPENAI_API_KEY = "test-key";
process.env.JWT_SECRET = "v784-test-secret-value";
const SECRET = process.env.JWT_SECRET;
const { createApp } = await import("../app.js");
const { verifyMayaContext } = await import("../maya/context.js");
const { signServiceToken } = await import("../lib/serviceToken.js");

const realFetch = globalThis.fetch;
const openaiBodies: any[] = [];
const bfUrls: string[] = [];
let base = "";
let server: http.Server;

beforeAll(async () => {
  const { app } = createApp();
  server = app.listen(0);
  await new Promise<void>((r) => server.once("listening", () => r()));
  base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = String(input);
    if (url.includes("api.openai.com")) {
      openaiBodies.push(JSON.parse(init.body));
      return new Response(JSON.stringify({ choices: [{ message: { role: "assistant", content: "ok" } }] }), { status: 200 });
    }
    bfUrls.push(url);
    return new Response(JSON.stringify({ ok: true, conversation_id: "c1" }), { status: 200 });
  }) as any;
});
afterAll(() => { globalThis.fetch = realFetch; server?.close(); });
beforeEach(() => { openaiBodies.length = 0; bfUrls.length = 0; });

function post(path: string, body: unknown, headers: Record<string, string> = {}): Promise<{ status: number; body: any }> {
  const data = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = http.request(base + path, { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": String(Buffer.byteLength(data)), ...headers } }, (res) => {
      let t = ""; res.setEncoding("utf8"); res.on("data", (c) => { t += c; });
      res.on("end", () => { try { resolve({ status: res.statusCode ?? 0, body: t ? JSON.parse(t) : {} }); } catch (e) { reject(e); } });
    });
    req.on("error", reject); req.end(data);
  });
}
function get(path: string): Promise<number> {
  return new Promise((resolve, reject) => {
    http.get(base + path, (res) => { res.resume(); res.on("end", () => resolve(res.statusCode ?? 0)); }).on("error", reject);
  });
}
const ctxToken = (claims: Record<string, unknown>, secret = SECRET) =>
  jwt.sign({ kind: "maya_context", ...claims }, secret, { algorithm: "HS256", expiresIn: "5m" });
const toolNames = () => ((openaiBodies[0]?.tools ?? []) as any[]).map((t) => t.function.name as string);
const ORIGIN = { Origin: "https://boreal.financial" };
const STAFF = { id: "u-1", name: "Todd", email: "todd@example.com", role: "Admin" };

describe("Maya identity (v784)", () => {
  it("a header-only staff claim gets public tools only", async () => {
    const r = await post("/api/maya/message", { message: "pipeline?", staff: STAFF }, { ...ORIGIN, "x-maya-audience": "staff", "x-forwarded-for": "10.0.0.1" });
    expect(r.status).toBe(200);
    expect(r.body.audience).toBe("visitor");
    expect(toolNames()).toContain("lead_capture");
    expect(toolNames()).not.toContain("pipeline_facts");
    expect(toolNames()).not.toContain("comm_send_sms");
    expect(openaiBodies[0].messages[0].content).not.toContain("SIGNED-IN STAFF MEMBER");
  });

  it("a valid X-Maya-Context staff token gets staff tools", async () => {
    const r = await post("/api/maya/message", { message: "pipeline?" }, { "x-maya-context": ctxToken({ audience: "staff", staff: STAFF, silo: "BF" }) });
    expect(r.status).toBe(200);
    expect(r.body.audience).toBe("staff");
    expect(toolNames()).toContain("pipeline_facts");
    expect(toolNames()).toContain("comm_send_sms");
    expect(openaiBodies[0].messages[0].content).toContain("SIGNED-IN STAFF MEMBER");
  });

  it("ignores a phone in the body", async () => {
    await post("/api/maya/message", { message: "my file?", phone: "+15875550100" }, { "x-maya-context": ctxToken({ audience: "client" }) });
    expect(bfUrls.some((u) => u.includes("/applications-by-phone"))).toBe(false);
    await post("/api/maya/message", { message: "my file?", phone: "+15875550100" }, { "x-maya-context": ctxToken({ audience: "client", phone: "+15875550199" }) });
    expect(bfUrls.some((u) => u.includes("/applications-by-phone"))).toBe(true);
  });

  it("a context signed with the wrong secret is public", async () => {
    const forged = ctxToken({ audience: "staff", staff: STAFF }, "not-the-real-secret");
    expect(verifyMayaContext(forged).audience).toBe("visitor");
    const r = await post("/api/maya/message", { message: "pipeline?" }, { ...ORIGIN, "x-maya-context": forged, "x-forwarded-for": "10.0.0.2" });
    expect(r.body.audience).toBe("visitor");
    expect(toolNames()).not.toContain("pipeline_facts");
  });

  it("rejects a context token of the wrong kind", () => {
    const svc = signServiceToken();
    expect(verifyMayaContext(svc).audience).toBe("visitor");
  });
});

describe("Maya rate limit and origin (v784)", () => {
  it("limits /maya/* to 30 requests a minute per IP", async () => {
    const h = { ...ORIGIN, "x-forwarded-for": "10.9.9.9" };
    for (let i = 0; i < 30; i++) expect((await post("/maya/escalate", { reason: "x" }, h)).status).toBe(200);
    expect((await post("/maya/escalate", { reason: "x" }, h)).status).toBe(429);
    // another IP is not affected
    expect((await post("/maya/escalate", { reason: "x" }, { ...ORIGIN, "x-forwarded-for": "10.9.9.8" })).status).toBe(200);
  });

  it("does not limit requests carrying a valid context or service token", async () => {
    const ip = { "x-forwarded-for": "10.7.7.7" };
    const ctx = ctxToken({ audience: "visitor" });
    for (let i = 0; i < 35; i++) expect((await post("/maya/escalate", { reason: "x" }, { ...ip, "x-maya-context": ctx })).status).toBe(200);
    const svc = { Authorization: "Bearer " + signServiceToken() };
    for (let i = 0; i < 35; i++) expect((await post("/maya/escalate", { reason: "x" }, { ...ip, ...svc })).status).toBe(200);
  });

  it("401s a Maya request with no Origin and no credential", async () => {
    expect((await post("/maya/escalate", { reason: "x" }, { "x-forwarded-for": "10.6.6.6" })).status).toBe(401);
    expect((await post("/api/maya/message", { message: "hi" }, { "x-forwarded-for": "10.6.6.6" })).status).toBe(401);
    const forged = jwt.sign({ kind: "service" }, "wrong-secret");
    expect((await post("/maya/escalate", { reason: "x" }, { Authorization: "Bearer " + forged })).status).toBe(401);
  });

  it("leaves / and /health alone", async () => {
    expect(await get("/")).toBe(200);
    expect(await get("/health")).toBe(200);
  });
});
