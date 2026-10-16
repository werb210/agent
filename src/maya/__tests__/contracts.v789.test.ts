// AGENT_v789_CONTRACT_FIXTURES [165] - every live tool runs against the BF-Server contract
// fixtures through the real callBFServer. The fetch fake refuses any path that is not a real
// BF-Server path, so a tool pointed at a made-up route fails here.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { TOOL_REGISTRY } from "../toolRegistry.js";
import { TOOLS_BY_AUDIENCE, type MayaAudience } from "../audience.js";
import { dispatchTool, type DispatchContext } from "../dispatch.js";
import { callBFServer } from "../../integrations/bfServerClient.js";
import { _clearHandoffState } from "../handoff.js";
import { _clearAllPendingActions } from "../pendingActions.js";
import { createBfServerFake, type FakeCall } from "../../../test/bfServerFake.js";
import { APPLICATION_SUMMARY, BF_SERVER_FIXTURES, REAL_BF_SERVER_PATHS, APP_ID } from "../../../test/fixtures/bfServer.v789.js";

const realFetch = globalThis.fetch;
let calls: FakeCall[] = [];
function useFake(overrides: Record<string, unknown> = {}) {
  const fake = createBfServerFake({ overrides });
  calls = fake.calls;
  globalThis.fetch = fake.fetch;
}
beforeEach(() => { process.env.JWT_SECRET = "contract-secret"; _clearHandoffState(); _clearAllPendingActions(); useFake(); });
afterEach(() => { globalThis.fetch = realFetch; });

const CTX: Record<MayaAudience, DispatchContext> = {
  visitor: { audience: "visitor", subject: "v-1", sessionId: "s-v", requestId: "r1" },
  client: { audience: "client", phone: "+17805550111", subject: "+17805550111", sessionId: "s-c", applicationId: APP_ID, requestId: "r1" },
  staff: { audience: "staff", subject: "u-7", staffId: "u-7", staffEmail: "todd@boreal.financial", staffRole: "Admin", silo: "BF", sessionId: "s-s", requestId: "r1", latestUserMessage: "go" },
};
const ARGS: Record<string, Record<string, unknown>> = {
  "visitor.identify": { name: "Dana Lee", email: "dana@northwind.example" }, "lead.capture": { email: "dana@northwind.example" },
  "waitlist.join": { email: "dana@northwind.example" }, "escalate.to_human": { summary: "wants a person" }, "book.callback": { reason: "rates" },
  "contact.find": { query: "Dana" }, "notes.read": { contact_id: "c1" }, "crm.add_note": { contact_id: "c1", body: "hi" },
  "crm.notes": { contact_id: "c1" }, "crm.tasks": { contact_id: "c1" }, "crm.create_task": { contact_id: "c1", title: "t" },
  "contact.timeline": { contact_id: "c1" }, "contact.picture": { contact_id: "c1" }, "application.summary": { application_id: APP_ID },
  "application.risk_flags": { application_id: APP_ID }, "banking.summary": { application_id: APP_ID }, "credit.summary": { application_id: APP_ID },
  "docs.request_draft": { application_id: APP_ID }, "application.underwriting_summary": { application_id: APP_ID }, "lender.match_explain": { application_id: APP_ID },
  "pgi.readiness": { application_id: APP_ID }, "todo.status": { application_id: APP_ID }, "comm.draft_email": { to: "dana@northwind.example", subject: "s", body: "b" },
  "comm.send_sms": { contact_id: "c1", body: "hi" }, "call.initiate": { contact_id: "c1" }, "pipeline.query": { question: "oldest active application" },
  "marketing.send_campaign": { channel: "email", tag: "past-clients", subject: "s", html: "<p>x</p>" }, "ads.negatives.add": { campaign: "111", terms: ["student loan"] },
  "ads.negatives.remove": { id: "neg_1" }, "ui.navigate": { target: "pipeline" }, "apply.field_help": { field: "annual revenue" },
  "docs.explain": { document_type: "bank statements" }, "industry.guidance": { industry: "trucking" }, "prequal.estimate": { monthly_revenue: 50000, months_in_business: 24 },
  "capital.readiness_check": { monthly_revenue: 50000, months_in_business: 24 },
};
// Tools whose answer is built in the agent (no BF-Server call).
// MAYA_v817 - forms.field_help answers from the agent (no BF-Server call).
const LOCAL_TOOLS = new Set(["forms.field_help", "info.products", "info.qualifications", "apply.start_url", "info.lenders", "capital.readiness_check", "prequal.estimate", "industry.guidance", "apply.doc_preview", "apply.field_help", "docs.explain", "ui.navigate"]);

const audienceOf = (tool: string): MayaAudience => (["client", "staff", "visitor"] as const).find((a) => TOOLS_BY_AUDIENCE[a].includes(tool))!;

describe("contract: every live tool against the BF-Server fixtures", () => {
  const tools = Object.keys(TOOL_REGISTRY).filter((t) => t !== "pending.confirm" && (["visitor", "client", "staff"] as const).some((a) => TOOLS_BY_AUDIENCE[a].includes(t)));

  it.each(tools)("%s calls only real BF-Server paths and succeeds on their real shapes", async (tool) => {
    const out = JSON.parse(await dispatchTool(tool, ARGS[tool] ?? {}, CTX[audienceOf(tool)]));
    expect(out.error ?? null, JSON.stringify(out)).toBeNull();
    expect(out.ok, JSON.stringify(out)).not.toBe(false);
    if (LOCAL_TOOLS.has(tool)) expect(calls).toEqual([]);
    else expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) {
      expect(REAL_BF_SERVER_PATHS).toContain(c.path);
      expect(c.path.startsWith("/api/")).toBe(true);
      expect(c.path).not.toMatch(/\/v1\//);
    }
  });

  it("the fake fails on any path that is not a real BF-Server path", async () => {
    await expect(callBFServer("/api/v1/maya/staff/application-summary", { method: "POST", body: {} })).rejects.toThrow(/not a real BF-Server path/);
    await expect(callBFServer("/api/applications/123", { method: "GET" })).rejects.toThrow(/not a real BF-Server path/);
  });

  it("the fixture list has no paths under /v1/ and lender products use interestMin/interestMax", () => {
    for (const p of REAL_BF_SERVER_PATHS) expect(p).toMatch(/^\/api\/(?!v1\/)/);
    const lp = BF_SERVER_FIXTURES["/api/maya/staff/lender-products"] as { ranges: Array<Record<string, unknown>> };
    expect(Object.keys(lp.ranges[0])).toEqual(expect.arrayContaining(["interestMin", "interestMax"]));
  });
});

describe("client tools on application-summary's v789 fields", () => {
  const client = CTX.client;
  const run = async (tool: string, overrides?: Record<string, unknown>) => {
    if (overrides) useFake({ "/api/maya/staff/application-summary": { ...APPLICATION_SUMMARY, ...overrides } });
    return JSON.parse(await dispatchTool(tool, { application_id: "someone-elses" }, client));
  };

  it("offer.explain explains each offer without naming a lender", async () => {
    const r = await run("offer.explain", { offers: [{ ...APPLICATION_SUMMARY.offers[0], lender_name: "Big Bank Capital" }, APPLICATION_SUMMARY.offers[1]] });
    expect(r.ok).toBe(true);
    expect(r.application_id).toBe(APP_ID);
    expect(r.offers).toEqual([
      { product: "TERM", amount: 200000, rate: "11.5%", rate_type: "APR", term: "36 months", status: "pending", expires_at: "2026-10-25T00:00:00.000Z" },
      { product: "MCA", amount: 120000, rate: "1.32", rate_type: "factor", term: "12 months", status: "pending", expires_at: "2026-10-20T00:00:00.000Z" },
    ]);
    expect(r.summary).toContain("2 offer(s)");
    expect(r.summary).toContain("$200,000 at 11.5% APR, 36 months, expires 2026-10-25");
    expect(r.summary).toContain("1.32 (factor rate)");
    expect(JSON.stringify(r)).not.toContain("Big Bank Capital");
    expect(calls.at(-1)?.body.application_id).toBe(APP_ID);
  });

  it("offer.explain with no offers says so", async () => {
    const r = await run("offer.explain", { offers: [] });
    expect(r).toMatchObject({ ok: true, offers: [] });
    expect(r.summary).toContain("don't have any lender offers yet");
  });

  it("signature.status reads signature_status", async () => {
    const pending = await run("signature.status");
    expect(pending).toMatchObject({ ok: true, status: "pending", signed: false });
    expect(pending.summary).toContain("still pending");
    const signed = await run("signature.status", { signature_status: "signed" });
    expect(signed).toMatchObject({ ok: true, status: "signed", signed: true });
    const none = await run("signature.status", { signature_status: null });
    expect(none).toMatchObject({ ok: true, status: null });
  });

  it("application.resume_link returns continuation_url", async () => {
    const r = await run("application.resume_link");
    expect(r).toMatchObject({ ok: true, application_id: APP_ID, resume_url: APPLICATION_SUMMARY.continuation_url });
    expect(r.summary).toContain(APPLICATION_SUMMARY.continuation_url);
    const none = await run("application.resume_link", { continuation_url: null });
    expect(none).toMatchObject({ ok: true, resume_url: null });
    expect(none.summary).toContain("sign in with your phone");
  });
});
