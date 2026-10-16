// MAYA_v817 - fixes from the live client-portal test ("TEST - Todd's Grocery Store", Additional Steps, 11 of 14
// done, three forms left): Maya said "all set", invented counts and stage names, was cut off after ~10 questions,
// and her limit message named a button the portal does not have and an 866 line without the number.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { dispatchTool, type DispatchContext } from "../dispatch.js";
import { TOOLS_BY_AUDIENCE } from "../audience.js";
import { descriptorsForAudience } from "../toolRegistry.js";
import { formsFieldHelp, CLIENT_FORMS } from "../tools/clientChecklistTools.js";
import { applicationNextStep } from "../tools/clientGuidanceTools.js";
import { CLIENT_STAGES, CLIENT_STAGE_GUIDE, clientStageLabel } from "../clientKnowledge.js";
import { _resetTokenBudgets, checkBudget, recordUsage, sessionDailyTokenBudget, dailyTokenBudget, sessionTokensUsed, tokensUsed } from "../tokenBudget.js";
import { _clearAllSessions, appendSessionTurn, getSessionHistory, MAX_HISTORY_ENTRY_CHARS } from "../sessionHistory.js";
import { _clearHandoffState } from "../handoff.js";
import { scrubPrivateNumbers } from "../guardrails.js";
import { budgetFallbackReply, helpSurface, FAILOVER_REPLIES, DEFAULT_866_LINE } from "../../api/maya.js";
import { createBfServerFake, type FakeCall } from "../../../test/bfServerFake.js";
import { APP_ID, APPLICATIONS_BY_PHONE, CLIENT_CHECKLIST } from "../../../test/fixtures/bfServer.v789.js";
import { post, startMayaRouter, type Started } from "../../../test/mayaHarness.js";
import { mayaContext } from "../../../test/mayaContext.js";

const realFetch = globalThis.fetch;
const PRIVATE = /403\D{0,3}555\D{0,3}0199/;
process.env.MAYA_PRIVATE_NUMBERS = "403-555-0199"; // a stand-in private number (the real one lives only in the setting)
const PHONE = "+17805550111";
const CLIENT: DispatchContext = { audience: "client", phone: PHONE, subject: PHONE, sessionId: "s-c", applicationId: APP_ID, requestId: "r1" };
let calls: FakeCall[] = [];
function useFake(overrides: Record<string, unknown> = {}, openai?: (c: FakeCall) => unknown) {
  const fake = createBfServerFake({ overrides, openai });
  calls = fake.calls;
  globalThis.fetch = fake.fetch;
}
const bodyOf = (path: string) => calls.find((c) => c.path === path)?.body;

beforeEach(() => {
  process.env.JWT_SECRET = "v817-secret";
  delete process.env.MAYA_SESSION_DAILY_TOKEN_BUDGET;
  delete process.env.MAYA_DAILY_TOKEN_BUDGET;
  delete process.env.MAYA_866_LINE;
  _resetTokenBudgets();
  _clearAllSessions();
  _clearHandoffState();
  useFake();
});
afterEach(() => { globalThis.fetch = realFetch; });

describe("1. application.checklist - the portal's own to-do list, forms included", () => {
  it("is a client tool only", () => {
    expect(TOOLS_BY_AUDIENCE.client).toContain("application.checklist");
    expect(TOOLS_BY_AUDIENCE.visitor).not.toContain("application.checklist");
    expect(TOOLS_BY_AUDIENCE.staff).not.toContain("application.checklist");
    expect(descriptorsForAudience("client").map((d) => d.function.name)).toContain("application.checklist");
  });

  it("returns the forms, counts and stage for the session's own application and verified phone, ignoring model ids", async () => {
    const out = JSON.parse(await dispatchTool("application.checklist", { application_id: "someone-elses-app", phone: "+19999999999" }, CLIENT));
    expect(out.ok).toBe(true);
    expect(out.stage).toBe("Additional Steps");
    expect(out.progress).toBe("11 of 14 done");
    expect(out.outstanding_forms).toBe(3);
    expect(out.outstanding.map((i: { label: string }) => i.label)).toEqual(["Debt Stack", "Personal Net Worth", "Professional Advisors"]);
    expect(bodyOf("/api/maya/client-checklist")).toMatchObject({ application_id: APP_ID, phone: PHONE });
  });

  it("with no application in the request, uses the verified phone's own application", async () => {
    const out = JSON.parse(await dispatchTool("application.checklist", {}, { ...CLIENT, applicationId: null, sessionId: "s-new" }));
    expect(out.ok).toBe(true);
    expect(bodyOf("/api/maya/staff/applications-by-phone")).toMatchObject({ phone: PHONE });
    expect(bodyOf("/api/maya/client-checklist")).toMatchObject({ application_id: APPLICATIONS_BY_PHONE.applications[0].id, phone: PHONE });
  });

  it("refuses without a verified phone and reports a server refusal as unavailable, not as 'nothing left'", async () => {
    const noPhone = JSON.parse(await dispatchTool("application.checklist", {}, { ...CLIENT, phone: null }));
    expect(noPhone.ok).toBe(false);
    useFake({ "/api/maya/client-checklist": new Response(JSON.stringify({ ok: false, error: "forbidden" }), { status: 403 }) });
    const refused = JSON.parse(await dispatchTool("application.checklist", {}, CLIENT));
    expect(refused).toMatchObject({ ok: false, error: "checklist_unavailable" });
    expect(JSON.stringify(refused)).not.toMatch(/all set|nothing left/i);
  });

  it("next_step names the outstanding forms instead of 'you're all set'", async () => {
    const r = await applicationNextStep({ application_id: APP_ID, phone: PHONE });
    expect(r.summary).toContain("Debt Stack");
    expect(r.summary).toContain("11 of 14 done");
    expect(r.summary).not.toMatch(/all set/i);
  });
});

describe("2. stages - the real list, in order, with the portal's labels", () => {
  it("follows the server's stage order and the portal's labels", () => {
    expect(CLIENT_STAGES.map((s) => s.server)).toEqual(["Received", "In Review", "Documents Required", "Additional Steps Required", "Off to Lender", "Offer", "Accepted"]);
    expect(CLIENT_STAGES.map((s) => s.label)).toEqual(["Received", "In Review", "Documents Required", "Additional Steps", "Off to Lender", "Offer", "Funded"]);
    expect(CLIENT_STAGE_GUIDE).toContain("4. Additional Steps - lenders need more items");
    expect(clientStageLabel("Additional Steps Required")).toBe("Additional Steps");
    expect(clientStageLabel("Accepted")).toBe("Funded");
  });
});

describe("2b. client instructions", () => {
  it("send to-do questions to application.checklist, forbid a false 'all set', and show the portal's stage label", async () => {
    const maya = await startMayaRouter();
    try {
      process.env.OPENAI_API_KEY = "test-key";
      const bodies: any[] = [];
      useFake({ "/api/maya/staff/applications-by-phone": { ...APPLICATIONS_BY_PHONE, applications: [{ ...APPLICATIONS_BY_PHONE.applications[0], name: "TEST - Todd's Grocery Store", stage: "Additional Steps Required" }] } },
        (c) => { bodies.push(c.body); return { choices: [{ message: { role: "assistant", content: "ok" } }], usage: { total_tokens: 10 } }; });
      await post(maya.base, "/api/maya/message", { message: "Anything left?", session_id: "p1", application_id: APP_ID, screen_context: { surface: "client", page: "Client portal chat (phone)" } },
        { "x-maya-context": mayaContext({ audience: "client", phone: PHONE }, "v817-secret") });
      const sys = String(bodies[0].messages[0].content);
      expect(sys).toContain("call application.checklist FIRST");
      expect(sys).toContain("Never say \"you're all set\"");
      expect(sys).toContain("never count or estimate them yourself");
      expect(sys).toContain("NEVER fill in a form for the client");
      expect(sys).toContain("4. Additional Steps - lenders need more items");
      expect(sys).toContain('"stage":"Additional Steps"');
      expect(sys).not.toContain('"stage":"Additional Steps Required"');
      expect(sys).not.toMatch(/Additional Steps Required -/);
      expect(sys).not.toContain("Talk to a Human");
      expect(sys).toContain("Send to my advisor");
      expect(bodies[0].tools.map((t: any) => t.function.name)).toEqual(expect.arrayContaining(["application_checklist", "forms_field_help"]));
    } finally {
      await maya.close();
    }
  });
});

describe("3. forms.field_help - real field labels, explain only", () => {
  it("covers the three forms by their titles and the names on the to-do list", async () => {
    const debt = await formsFieldHelp({ form: "Debt Stack" });
    expect(debt.form).toBe("Debt Schedule");
    const debtLabels = JSON.stringify(debt.sections);
    for (const l of ["Lender / creditor", "Facility type", "Original amount", "Current balance", "Monthly payment", "Rate %", "Maturity", "Secured by", "Notes"]) expect(debtLabels).toContain(l);
    expect((await formsFieldHelp({ form: "Personal Net Worth" })).form).toBe("Personal Statement of Affairs");
    const pnw = JSON.stringify((await formsFieldHelp({ form: "personal statement of affairs" })).sections);
    for (const l of ["SIN (Canada) or SSN (US)", "Marital status", "Ever filed for bankruptcy", "Taxes owing (CRA or IRS)", "Mortgage on real estate 1-3"]) expect(pnw).toContain(l);
    const adv = JSON.stringify((await formsFieldHelp({ form: "Professional Advisors" })).sections);
    for (const l of ["Firm", "Contact", "Accounting software used", "Primary bank", "Authorized limit (existing facility)", "I authorize Boreal Financial"]) expect(adv).toContain(l);
  });

  it("narrows to the asked field and always carries the never-fill-in rule", async () => {
    const r = await formsFieldHelp({ form: "debt schedule", field: "maturity" });
    expect(r.matching_fields?.map((f) => f.label)).toEqual(["Maturity"]);
    for (const f of CLIENT_FORMS) expect((await formsFieldHelp({ form: f.title })).rule).toMatch(/Never fill in, suggest, estimate or make up/);
  });
});

describe("4. budget and history", () => {
  it("per-session budget comes from MAYA_SESSION_DAILY_TOKEN_BUDGET, default 2,000,000, and still stops a session", () => {
    expect(sessionDailyTokenBudget({})).toBe(2_000_000);
    expect(sessionDailyTokenBudget({ MAYA_SESSION_DAILY_TOKEN_BUDGET: "500000" })).toBe(500_000);
    expect(sessionDailyTokenBudget({ MAYA_SESSION_DAILY_TOKEN_BUDGET: "junk" })).toBe(2_000_000);
    expect(dailyTokenBudget({})).toBeGreaterThan(sessionDailyTokenBudget({}));
    process.env.MAYA_SESSION_DAILY_TOKEN_BUDGET = "1000";
    recordUsage("k", 999);
    expect(checkBudget("k").ok).toBe(true);
    recordUsage("k", 1);
    expect(checkBudget("k")).toEqual({ ok: false, scope: "session" });
  });

  it("caps each history entry, so a turn's resent history stays bounded", () => {
    appendSessionTurn("h", "x".repeat(10_000), "y".repeat(10_000));
    const h = getSessionHistory("h");
    expect(h[0].content.length).toBe(MAX_HISTORY_ENTRY_CHARS);
    expect(h[1].content.length).toBe(MAX_HISTORY_ENTRY_CHARS);
  });
});

describe("4b. a 250-question client conversation is not cut off", () => {
  let maya: Started;
  beforeAll(async () => { maya = await startMayaRouter(); });
  afterAll(async () => { await maya.close(); });

  it("answers all 250 questions with a tool round each, and turn 250 sends no more than turn 20", async () => {
    process.env.OPENAI_API_KEY = "test-key";
    const sizes: number[] = [];
    let sessionUsed = 0;
    const previous: string[] = [];
    // Usage as OpenAI reports it: ~4 characters a token for everything sent plus the reply, and its automatic
    // prompt cache - the longest prefix (tools, then messages) shared with an earlier request, in 128-token
    // blocks, once it is at least 1,024 tokens.
    const openai = (c: FakeCall) => {
      const prompt = JSON.stringify(c.body.tools ?? []) + c.body.messages.map((m: unknown) => JSON.stringify(m)).join("");
      let common = 0;
      for (const p of previous.slice(-4)) {
        let n = 0;
        const max = Math.min(p.length, prompt.length);
        while (n < max && p.charCodeAt(n) === prompt.charCodeAt(n)) n++;
        common = Math.max(common, n);
      }
      previous.push(prompt);
      const promptTokens = Math.ceil(JSON.stringify(c.body).length / 4);
      const cachedTokens = Math.floor(common / 4 / 128) * 128;
      const cached = cachedTokens >= 1024 ? Math.min(cachedTokens, promptTokens) : 0;
      const total = promptTokens + 250;
      sessionUsed += Math.ceil(total - cached * 0.75);
      const last = c.body.messages.at(-1);
      const message = last.role === "tool"
        ? { role: "assistant", content: "You're at Additional Steps with 3 forms left: Debt Stack, Personal Net Worth and Professional Advisors. ".repeat(3) }
        : { role: "assistant", content: null, tool_calls: [{ id: "t" + sizes.length, type: "function", function: { name: "application_checklist", arguments: "{}" } }] };
      if (last.role !== "tool") sizes.push(JSON.stringify(c.body).length);
      return { choices: [{ message }], usage: { total_tokens: total, prompt_tokens: promptTokens, prompt_tokens_details: { cached_tokens: cached } } };
    };
    useFake({}, openai);
    const ctx = { "x-maya-context": mayaContext({ audience: "client", phone: PHONE }, "v817-secret") };
    for (let i = 1; i <= 250; i++) {
      const r = await post(maya.base, "/api/maya/message", {
        message: `Question ${i}: is there anything else I need to do on my application, and which forms are left? Please explain what each one needs.`,
        session_id: "long-chat", application_id: APP_ID,
        screen_context: { surface: "client", page: "Client portal chat (phone)", application_id: APP_ID },
      }, ctx);
      expect(r.body.fallback, `question ${i}`).toBeUndefined();
      expect(r.body.stopped, `question ${i}`).toBeUndefined();
      expect(r.body.reply).toContain("Debt Stack");
    }
    expect(sizes.length).toBe(250);
    // the history window is bounded: the last question sends no more than the 20th
    expect(sizes[249]).toBeLessThanOrEqual(sizes[19] + 200);
    expect(sessionUsed).toBeLessThan(sessionDailyTokenBudget());
  }, 120_000);

  it("counts cached prompt tokens at a quarter against the session, in full against the global budget", () => {
    const body = { messages: [] };
    expect(sessionTokensUsed({ usage: { total_tokens: 10_000, prompt_tokens_details: { cached_tokens: 8_000 } } }, body)).toBe(4_000);
    expect(sessionTokensUsed({ usage: { total_tokens: 10_000 } }, body)).toBe(10_000);
    expect(sessionTokensUsed({ usage: { total_tokens: 10_000, prompt_tokens_details: { cached_tokens: 20_000 } } }, body)).toBe(10_000);
    expect(tokensUsed({ usage: { total_tokens: 10_000, prompt_tokens_details: { cached_tokens: 8_000 } } }, body)).toBe(10_000);
  });
});

describe("5. limit and fallback messages", () => {
  it("in the client portal chat: no Talk to a Human, the advisor instead, and the 866 number", () => {
    const surface = helpSurface("client", { surface: "client", page: "Client portal chat (phone)" });
    expect(surface).toBe("client_portal_chat");
    const msg = budgetFallbackReply(surface);
    expect(msg).not.toMatch(/Talk to a Human/);
    expect(msg).toContain("Send to my advisor");
    expect(msg).toContain("1-866-631-8939");
    expect(DEFAULT_866_LINE).toBe("1-866-631-8939");
    expect(FAILOVER_REPLIES.failed(surface)).not.toMatch(/Talk to a Human/);
  });

  it("names Talk to a Human only where the widget has it, and never a button on an unknown screen", () => {
    expect(budgetFallbackReply("website")).toContain("Talk to a Human");
    expect(budgetFallbackReply(helpSurface("client", { page: "Application wizard - Step 2 of 6" }))).toContain("Talk to a Human");
    const unknown = budgetFallbackReply(helpSurface("client", null));
    expect(unknown).not.toMatch(/Talk to a Human|tap/i);
    expect(unknown).toContain("1-866-631-8939");
    expect(budgetFallbackReply("staff")).not.toMatch(/Talk to a Human/);
  });

  it("MAYA_866_LINE overrides the number, but never with the private cell", () => {
    process.env.MAYA_866_LINE = "1-866-555-0100";
    expect(budgetFallbackReply()).toContain("1-866-555-0100");
    process.env.MAYA_866_LINE = "403-555-0199";
    expect(budgetFallbackReply()).not.toMatch(PRIVATE);
  });
});

describe("6. a private number never appears", () => {
  it("is scrubbed in every spelling", () => {
    for (const t of ["403-555-0199", "(403) 555-0199", "+1 403 555 0199", "4035550199", "1.403.555.0199"]) {
      const out = scrubPrivateNumbers(`Call Todd at ${t} anytime.`);
      expect(out).not.toMatch(PRIVATE);
      expect(out).toContain("1-866-631-8939");
    }
  });

  it("is in no prompt, tool description, or reply - even when the model or trained knowledge says it", async () => {
    const maya = await startMayaRouter();
    try {
      process.env.OPENAI_API_KEY = "test-key";
      const bodies: any[] = [];
      for (const audience of ["visitor", "client", "staff"] as const) {
        useFake({ "/api/maya/knowledge-search": { ok: true, context: "Owner cell: 403-555-0199" } }, (c) => {
          bodies.push(c.body);
          return { choices: [{ message: { role: "assistant", content: "Text Todd on (403) 555-0199." } }], usage: { total_tokens: 10 } };
        });
        const claims = audience === "staff" ? { audience, staff: { id: "u1", name: "Todd", email: "t@b.f", role: "Admin" } } : audience === "client" ? { audience, phone: PHONE } : { audience, sub: "v" };
        const r = await post(maya.base, "/api/maya/message", { message: "What's Todd's number?", session_id: "p-" + audience }, { "x-maya-context": mayaContext(claims, "v817-secret") });
        expect(r.body.reply).not.toMatch(PRIVATE);
        expect(r.body.reply).toContain("1-866-631-8939");
      }
      for (const b of bodies) expect(JSON.stringify(b)).not.toMatch(PRIVATE);
      for (const fb of ["website", "client_widget", "client_portal_chat", "staff", "unknown"] as const) {
        expect(budgetFallbackReply(fb)).not.toMatch(PRIVATE);
        expect(FAILOVER_REPLIES.failed(fb)).not.toMatch(PRIVATE);
      }
      expect(JSON.stringify(CLIENT_CHECKLIST)).not.toMatch(PRIVATE);
    } finally {
      await maya.close();
    }
  });
});
