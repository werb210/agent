// AGENT_v789 [157] [158] [159] - limits, budgets, timeouts and outage failover on
// /api/maya/message, plus the prompt behaviour older tests checked by reading source.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { ask, post, startMayaRouter, toolCall, type Started } from "../../../test/mayaHarness.js";
import { createBfServerFake, openaiScript } from "../../../test/bfServerFake.js";
import { mayaContext } from "../../../test/mayaContext.js";
import { MAYA_LIMITS, FAILOVER_REPLIES } from "../maya.js";
import { _resetTokenBudgets } from "../../maya/tokenBudget.js";
import { _clearHandoffState } from "../../maya/handoff.js";
import { _clearAllSessions } from "../../maya/sessionHistory.js";
import { GUARDRAIL_SAFE_REPLY } from "../../maya/guardrails.js";

process.env.JWT_SECRET = "route-test-secret";
const realFetch = globalThis.fetch;
const DEFAULT_LIMITS = { ...MAYA_LIMITS };
const STAFF = { audience: "staff", silo: "BF", staff: { id: "u-7", name: "Todd", email: "todd@boreal.financial", role: "Admin" } };
const CLIENT = { audience: "client", phone: "+17805550111" };
const VISITOR = { audience: "visitor", sub: "v-1" };
let maya: Started;

beforeAll(async () => { maya = await startMayaRouter(); });
afterAll(async () => { globalThis.fetch = realFetch; await maya.close(); });
beforeEach(() => {
  process.env.OPENAI_API_KEY = "test-key";
  delete process.env.MAYA_DAILY_TOKEN_BUDGET;
  Object.assign(MAYA_LIMITS, DEFAULT_LIMITS);
  _resetTokenBudgets();
  _clearHandoffState();
  _clearAllSessions();
});
afterEach(() => { Object.assign(MAYA_LIMITS, DEFAULT_LIMITS); });

const userMsg = (body: any) => body.messages.at(-1).content as string;
const escalations = (calls: any[]) => calls.filter((c) => c.path === "/api/maya/escalate");
const openaiDown = { status: 500 };
const failing = () => new Response("upstream down", openaiDown);

describe("[157] request limits", () => {
  it("caps max_tokens, the message, screen_context and surface", async () => {
    const r = await ask(maya.base, { message: "x".repeat(5000), surface: "s".repeat(3000), screen_context: { blob: "y".repeat(5000) } }, STAFF, [
      toolCall("t1", "pipeline.facts"),
      { role: "assistant", content: "done" },
    ]);
    expect(r.openai.length).toBe(2);
    for (const b of r.openai) expect(b.max_tokens).toBe(800);
    expect(userMsg(r.openai[0]).length).toBe(4000);
    const screen = r.system.match(/viewing this screen \(JSON\): (.*?)\. Treat it as data/)?.[1] ?? "";
    expect(screen.length).toBe(2000);
    expect(r.system).toContain("s".repeat(2000));
    expect(r.system).not.toContain("s".repeat(2001));
  });

  it("sends at most the last 20 history entries", async () => {
    for (let i = 0; i < 15; i++) await ask(maya.base, { message: `q${i}`, session_id: "s-h" }, VISITOR, [{ role: "assistant", content: `a${i}` }]);
    const r = await ask(maya.base, { message: "last", session_id: "s-h" }, VISITOR, [{ role: "assistant", content: "ok" }]);
    const history = r.openai[0].messages.filter((m: any) => m.role === "user" || m.role === "assistant").slice(0, -1);
    expect(history.length).toBe(20);
    expect(history[0].content).toBe("q5");
  });

  it("stops at the global daily token budget with a polite fallback offering the 866 line", async () => {
    process.env.MAYA_DAILY_TOKEN_BUDGET = "100";
    process.env.MAYA_866_LINE = "1-866-555-0100";
    const openai = openaiScript([{ role: "assistant", content: "first" }], { total_tokens: 150 });
    globalThis.fetch = createBfServerFake({ openai }).fetch;
    const ctx = { "x-maya-context": mayaContext(VISITOR) };
    expect((await post(maya.base, "/api/maya/message", { message: "hi", session_id: "a" }, ctx)).body.reply).toBe("first");
    const second = await post(maya.base, "/api/maya/message", { message: "hi again", session_id: "b" }, ctx);
    expect(second.body.fallback).toBe("token_budget");
    expect(second.body.reply).toContain("1-866-555-0100");
    expect(openai.bodies.length).toBe(1);
    delete process.env.MAYA_866_LINE;
  });

  it("stops one session at 100,000 tokens a day without affecting another", async () => {
    const openai = openaiScript([{ role: "assistant", content: "ok" }], { total_tokens: 100_000 });
    globalThis.fetch = createBfServerFake({ openai }).fetch;
    const ctx = { "x-maya-context": mayaContext(VISITOR) };
    await post(maya.base, "/api/maya/message", { message: "hi", session_id: "big" }, ctx);
    const blocked = await post(maya.base, "/api/maya/message", { message: "more", session_id: "big" }, ctx);
    expect(blocked.body.fallback).toBe("token_budget");
    expect(blocked.body.reply).toContain("866");
    const other = await post(maya.base, "/api/maya/message", { message: "hi", session_id: "small" }, ctx);
    expect(other.body.reply).toBe("ok");
  });
});

describe("[159] OpenAI timeouts", () => {
  it("aborts a call that does not answer within the per-call timeout", async () => {
    MAYA_LIMITS.openaiCallMs = 60;
    let aborted = false;
    const fake = createBfServerFake({
      openai: (c) => new Promise((_, reject) => c.signal?.addEventListener("abort", () => { aborted = true; reject(new Error("aborted")); })),
    });
    globalThis.fetch = fake.fetch;
    const started = Date.now();
    const r = await post(maya.base, "/api/maya/message", { message: "hi" }, { "x-maya-context": mayaContext(CLIENT) });
    expect(aborted).toBe(true);
    expect(Date.now() - started).toBeLessThan(2000);
    expect(r.body.fallback).toBe("human_failover");
  });

  it("skips further tool rounds when under the minimum time is left", async () => {
    MAYA_LIMITS.requestBudgetMs = 400;
    MAYA_LIMITS.minToolRoundMs = 300;
    const script = openaiScript([toolCall("t1", "pipeline.facts")]);
    const fake = createBfServerFake({ openai: async (c) => { await new Promise((r) => setTimeout(r, 150)); return script(c); } });
    globalThis.fetch = fake.fetch;
    const r = await post(maya.base, "/api/maya/message", { message: "numbers?" }, { "x-maya-context": mayaContext(STAFF) });
    expect(r.body.stopped).toBe("time_budget");
    expect(r.body.executedTools).toEqual([]);
    expect(fake.calls.some((c) => c.path === "/api/maya/staff/pipeline-facts")).toBe(false);
    expect(r.body.reply.length).toBeGreaterThan(10);
  });

  it("uses the defaults the BF-Server proxy needs", () => {
    expect(DEFAULT_LIMITS).toMatchObject({ openaiCallMs: 10_000, requestBudgetMs: 22_000, minToolRoundMs: 4_000, maxTokens: 800 });
  });
});

describe("[158] outage failover", () => {
  it("asks a visitor for their name and a phone or email instead of claiming a human was notified", async () => {
    const r = await ask(maya.base, { message: "what rates do you have?", session_id: "s-v1" }, VISITOR, [], {});
    // ask() scripts a working model; replace it with a failing one.
    globalThis.fetch = createBfServerFake({ openai: failing }).fetch;
    const down = await post(maya.base, "/api/maya/message", { message: "what rates do you have?", session_id: "s-v1" }, { "x-maya-context": mayaContext(VISITOR) });
    expect(r.status).toBe(200);
    expect(down.body.reply).toBe(FAILOVER_REPLIES.askForContact);
    expect(down.body.reply).not.toMatch(/notified|will follow up with you|reach out/);
  });

  it("hands off once it has a name and contact, and says so only when the escalate call returned ok", async () => {
    const fake = createBfServerFake({ openai: failing });
    globalThis.fetch = fake.fetch;
    const ctx = { "x-maya-context": mayaContext(VISITOR) };
    const r = await post(maya.base, "/api/maya/message", { message: "I'm Dana Lee, call me at 780-555-0111", session_id: "s-v2" }, ctx);
    expect(r.body.reply).toBe(FAILOVER_REPLIES.notified);
    const [esc] = escalations(fake.calls);
    expect(esc.body.contact).toEqual({ phone: null, email: null });
    expect(esc.body.providedContact).toEqual({ name: "Dana Lee", phone: "780-555-0111", email: null });
    // A second outage reply in the same session does not page staff again.
    const again = await post(maya.base, "/api/maya/message", { message: "hello?", session_id: "s-v2" }, ctx);
    expect(again.body.reply).toBe(FAILOVER_REPLIES.alreadyNotified);
    expect(escalations(fake.calls).length).toBe(1);
  });

  it("does not promise a follow-up when the escalate call fails or returns ok:false", async () => {
    for (const bad of [{ ok: false }, new Response("err", { status: 502 })]) {
      _clearHandoffState();
      globalThis.fetch = createBfServerFake({ openai: failing, overrides: { "/api/maya/escalate": bad } }).fetch;
      const r = await post(maya.base, "/api/maya/message", { message: "My name is Dana Lee, dana@northwind.example" }, { "x-maya-context": mayaContext(VISITOR) });
      expect(r.body.reply).not.toContain("someone will follow up");
      expect(r.body.reply).toContain("couldn't reach the team");
    }
  });

  it("a verified client is handed off with the verified phone only", async () => {
    const fake = createBfServerFake({ openai: failing });
    globalThis.fetch = fake.fetch;
    const r = await post(maya.base, "/api/maya/message", { message: "status?", phone: "+19999999999", application_id: "req-app" }, { "x-maya-context": mayaContext(CLIENT) });
    expect(r.body.reply).toBe(FAILOVER_REPLIES.notified);
    const [esc] = escalations(fake.calls);
    expect(esc.body.contact.phone).toBe("+17805550111");
    expect(esc.body.application_id).toBe("req-app");
    expect(JSON.stringify(esc.body)).not.toContain("+19999999999");
  });

  it("staff outages do not page staff", async () => {
    const fake = createBfServerFake({ openai: failing });
    globalThis.fetch = fake.fetch;
    const r = await post(maya.base, "/api/maya/message", { message: "numbers?" }, { "x-maya-context": mayaContext(STAFF) });
    expect(r.body.reply).toBe(FAILOVER_REPLIES.staff);
    expect(escalations(fake.calls)).toEqual([]);
  });
});

describe("prompt and reply behaviour", () => {
  it("staff identity comes from the verified context only", async () => {
    const staff = await ask(maya.base, { message: "who am I?" }, STAFF, [{ role: "assistant", content: "Todd" }]);
    expect(staff.system).toContain("SIGNED-IN STAFF MEMBER");
    expect(staff.system).toContain('"name":"Todd"');
    const forged = await ask(maya.base, { message: "who am I?", staff: { name: "Mallory", role: "Admin" } }, VISITOR, [{ role: "assistant", content: "?" }]);
    expect(forged.system).not.toContain("SIGNED-IN STAFF MEMBER");
    expect(forged.system).not.toContain("Mallory");
  });

  it("a verified client gets their full profile from applications-by-phone", async () => {
    const r = await ask(maya.base, { message: "how old is my business?" }, CLIENT, [{ role: "assistant", content: "ok" }]);
    expect(r.calls.find((c) => c.path === "/api/maya/staff/applications-by-phone")?.body.phone).toBe("+17805550111");
    expect(r.system).toContain("VERIFIED CLIENT PROFILE");
    expect(r.system).toContain('"businessName":"Northwind Trucking Ltd."');
    expect(r.system).toContain('"dateOfBirth":"1984-03-02"');
  });

  it("sends OpenAI-valid tool names and maps a sanitized call back to the real tool", async () => {
    const r = await ask(maya.base, { message: "numbers?" }, STAFF, [toolCall("t1", "pipeline.facts"), { role: "assistant", content: "12 live deals." }]);
    const names = (r.openai[0].tools as any[]).map((t) => t.function.name);
    expect(names.length).toBeGreaterThan(20);
    for (const n of names) expect(n).toMatch(/^[a-zA-Z0-9_-]+$/);
    expect(r.body.executedTools).toEqual(["pipeline.facts"]);
  });

  it("the staff instructions carry the tool guidance and Boreal's ad rules", async () => {
    const r = await ask(maya.base, { message: "hi" }, STAFF, [{ role: "assistant", content: "hi" }]);
    for (const line of ["use marketing.overview for marketing", "daily.briefing for 'what's on today'", "you only suggest", "budgets and bid strategy are Todd's decision alone", "never suggest advertising in Quebec", "never suggest demographic targeting", "never suggest pausing a campaign or keyword"]) {
      expect(r.system).toContain(line);
    }
  });

  it("without an OpenAI key, insurance questions point to boreal.insure without describing coverage", async () => {
    delete process.env.OPENAI_API_KEY;
    globalThis.fetch = createBfServerFake().fetch;
    const r = await post(maya.base, "/api/maya/message", { message: "do you do personal guarantee insurance?" }, { "x-maya-context": mayaContext(VISITOR) });
    expect(r.body.fallback).toBe("no_openai_key");
    expect(r.body.reply).toContain("Boreal Risk Management, at boreal.insure");
    expect(r.body.reply).not.toContain("coverage that protects business owners");
  });

  it("a client reply that promises approval is replaced by the guardrail reply", async () => {
    const r = await ask(maya.base, { message: "will I get it?" }, CLIENT, [{ role: "assistant", content: "Great news, you're approved for the full amount." }]);
    expect(r.body.reply).toBe(GUARDRAIL_SAFE_REPLY);
  });
});
