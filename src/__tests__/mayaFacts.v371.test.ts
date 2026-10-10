// AGENT_MAYA_FACTS_v371 + AGENT_MAYA_SITE_FACTS_v371 + AGENT_MAYA_CLIENT_v371 + AGENT_MAYA_TOOL_LOOP_v371
import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";

const bfTool = vi.hoisted(() => ({ calls: [] as Array<{ path: string; body: any }> }));
vi.mock("../integrations/bfServerClient.js", async (orig) => {
  const real: any = await orig();
  return { ...real, callBFServer: async (path: string, opts: any) => {
    bfTool.calls.push({ path, body: opts?.body ?? null });
    if (path.includes("/pipeline-facts")) return { ok: true, active_count: 9, funded_this_month: 0, by_stage: { "Documents Required": { count: 1, applications: [{ name: "BIBUSA CN LLC" }] } } };
    if (path.includes("/application-summary")) return { ok: true, summary: { name: "BIBUSA CN LLC" } };
    return { ok: true };
  } };
});
import express from "express";
import type { AddressInfo } from "node:net";
import { readFileSync } from "node:fs";
import http from "node:http";

process.env.OPENAI_API_KEY = "test-key";
process.env.JWT_SECRET = "test-secret-at-least-10";
const { mayaRouter } = await import("../api/maya.js");
const { TOOLS_BY_AUDIENCE } = await import("../maya/audience.js");

const realFetch = globalThis.fetch;
const openaiBodies: any[] = [];
const bfCalls: Array<{ url: string; body: any }> = [];
let openaiScript: any[] = [];
let base = "";
let server: any;

beforeAll(async () => {
  const app = express(); app.use(express.json()); app.use(mayaRouter);
  server = app.listen(0); base = "http://127.0.0.1:" + (server.address() as AddressInfo).port;
  globalThis.fetch = (async (input: any, init?: any) => {
    const url = String(input);
    if (url.includes("api.openai.com")) {
      openaiBodies.push(JSON.parse(init.body));
      const msg = openaiScript.shift() ?? { role: "assistant", content: "" };
      return new Response(JSON.stringify({ choices: [{ message: msg }] }), { status: 200 });
    }
    bfCalls.push({ url, body: init?.body ? JSON.parse(init.body) : null });
    if (url.includes("/pipeline-facts")) return new Response(JSON.stringify({ ok: true, active_count: 9, funded_this_month: 0, by_stage: { "Documents Required": { count: 1, applications: [{ name: "BIBUSA CN LLC", id: "app-1" }] } } }), { status: 200 });
    if (url.includes("/application-summary")) return new Response(JSON.stringify({ ok: true, summary: { name: "BIBUSA CN LLC" } }), { status: 200 });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as any;
});
afterAll(() => { globalThis.fetch = realFetch; server?.close(); });

// node:http rather than fetch: the shared test setup fakes a browser window, which breaks fetch reads of a local server.
const ask = (body: any, audience: string): Promise<any> => new Promise((resolve, reject) => {
  const data = JSON.stringify(body);
  const req = http.request(base + "/api/maya/message", { method: "POST", headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(data), "x-maya-audience": audience } }, (res) => {
    let t = ""; res.setEncoding("utf8"); res.on("data", (c) => { t += c; }); res.on("end", () => { try { resolve(JSON.parse(t || "{}")); } catch (e) { reject(e); } });
  });
  req.on("error", reject); req.end(data);
});

describe("staff Maya", () => {
  it("can chain tools (find, then summarise) and answers from them", async () => {
    openaiBodies.length = 0; bfCalls.length = 0;
    openaiScript = [
      { role: "assistant", content: null, tool_calls: [{ id: "t1", type: "function", function: { name: "pipeline_facts", arguments: "{}" } }] },
      { role: "assistant", content: null, tool_calls: [{ id: "t2", type: "function", function: { name: "application_summary", arguments: JSON.stringify({ name: "BIBUSA" }) } }] },
      { role: "assistant", content: "BIBUSA CN LLC is in Documents Required." },
    ];
    const r = await ask({ message: "Who is in Documents Required and what's the detail on it?", staff: { name: "Todd", role: "Admin" }, screen_context: { silo: "BF" } }, "staff");
    expect(r.reply).toBe("BIBUSA CN LLC is in Documents Required.");
    expect(r.executedTools).toEqual(["pipeline.facts", "application.summary"]);
    const facts = bfTool.calls.find((c) => c.path.includes("/pipeline-facts"))!;
    expect(facts.body.role).toBe("Admin");
    expect(facts.body.silo).toBe("BF");
    expect(bfTool.calls.find((c) => c.path.includes("/application-summary"))!.body.name).toBe("BIBUSA");
    expect(openaiBodies[1].tools?.length).toBeGreaterThan(0);
    const sys = openaiBodies[0].messages[0].content as string;
    expect(sys).toContain("2630108 Alberta Ltd.");
    expect(sys).toContain("call pipeline.facts first");
    expect(sys).toContain("Never estimate or make up a number");
  });
  it("never returns a blank reply", async () => {
    openaiScript = [
      { role: "assistant", content: null, tool_calls: [{ id: "t1", type: "function", function: { name: "pipeline_facts", arguments: "{}" } }] },
      { role: "assistant", content: "" },
    ];
    const r = await ask({ message: "Summarize the last 30 days", staff: { role: "Admin" } }, "staff");
    expect(r.reply.length).toBeGreaterThan(10);
  });
});

describe("website Maya uses the site's facts", () => {
  it("carries the website answers and no longer offers the tools that leaked internal counts", async () => {
    openaiBodies.length = 0;
    openaiScript = [{ role: "assistant", content: "Boreal never pulls your credit." }];
    await ask({ message: "Will applying hurt my credit?" }, "visitor");
    const sys = openaiBodies[0].messages[0].content as string;
    for (const fact of ["never pulls your credit", "as little as 3-4 days", "$10K to $100M+", "80+ lenders", "at least 6 months in business", "SBA loans are available to start-ups", "Boreal's own team reviews the file first", "the lender pays Boreal", "2% fee agreement", "Talk to a Human button", "https://boreal.financial/us", "Personal Guarantee Insurance", "waitlist.join"]) expect(sys).toContain(fact);
    expect(sys).not.toContain("1-866");
    expect(TOOLS_BY_AUDIENCE.visitor).not.toContain("info.lenders");
    expect(TOOLS_BY_AUDIENCE.visitor).not.toContain("catalog.summary");
    expect(sys).toContain("Never end a reply with 'Would you like to proceed?'");
  });
});

describe("client Maya", () => {
  it("sees the full application profile and follows the client rules", async () => {
    openaiBodies.length = 0;
    openaiScript = [{ role: "assistant", content: "ok" }];
    const prev = globalThis.fetch;
    globalThis.fetch = (async (input: any, init?: any) => {
      if (String(input).includes("/applications-by-phone")) {
        return new Response(JSON.stringify({ ok: true, contactName: "Todd", applications: [{ shortId: "61AE", name: "TEST - Todd's Grocery Store", productCategory: "SBA", stage: "Off to Lender",
          business: { street: "1 Main", employees: 12 }, financialProfile: { useOfFunds: "Expansion", existingDebt: 0 }, documents: { missing: [], received: ["Lease"], accepted: ["Bank statements"] } }], offers: [] }), { status: 200 });
      }
      return (prev as any)(input, init);
    }) as any;
    await ask({ message: "What do you have on my business?", phone: "+15875550100" }, "client");
    globalThis.fetch = prev;
    const sys = openaiBodies[0].messages[0].content as string;
    expect(sys).toContain('"shortId":"61AE"');
    expect(sys).toContain('"useOfFunds":"Expansion"');
    expect(sys).toContain('"received":["Lease"]');
    expect(sys).toContain("Off to Lender - your file is with lenders");
    expect(sys).toContain("Never say which lenders, or how many lenders, have their file");
    expect(sys).toContain("FACTOR RATE");
  });
});

describe("qualifications match the website", () => {
  it("no longer quotes credit floors or $120k revenue minimums", () => {
    const cat = readFileSync("src/maya/tools/infoCatalog.ts", "utf8");
    expect(cat).not.toContain("Mid-600s");
    expect(cat).toContain("Boreal never pulls your credit");
    expect(cat).toContain("Canada: at least 6 months in business");
  });
});
