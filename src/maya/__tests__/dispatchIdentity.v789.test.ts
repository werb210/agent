// AGENT_v789_IDENTITY [154] [161] [163] - identity and authority never come from the model.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { dispatchTool, getResolvedApplicationId, rememberResolvedApplicationId, applicationIdFromFindMine, type DispatchContext } from "../dispatch.js";
import { TOOLS_BY_AUDIENCE } from "../audience.js";
import { sessionKey } from "../sessionKey.js";
import { _clearHandoffState, rememberProvidedContact } from "../handoff.js";
import { createBfServerFake, type FakeCall } from "../../../test/bfServerFake.js";
import { APP_ID } from "../../../test/fixtures/bfServer.v789.js";

const realFetch = globalThis.fetch;
let calls: FakeCall[] = [];
function useFake(overrides: Record<string, unknown> = {}) {
  const fake = createBfServerFake({ overrides });
  calls = fake.calls;
  globalThis.fetch = fake.fetch;
}
beforeEach(() => { process.env.JWT_SECRET = "dispatch-test-secret"; _clearHandoffState(); useFake(); });
afterEach(() => { globalThis.fetch = realFetch; });

const client = (over: Partial<DispatchContext> = {}): DispatchContext => ({ audience: "client", phone: "+15875550100", subject: "+15875550100", sessionId: "s-client", applicationId: "req-app-1", ...over });
const visitor = (over: Partial<DispatchContext> = {}): DispatchContext => ({ audience: "visitor", subject: "v-1", sessionId: "s-visitor", ...over });
const staff = (over: Partial<DispatchContext> = {}): DispatchContext => ({ audience: "staff", subject: "u-7", staffId: "u-7", staffEmail: "todd@boreal.financial", staffRole: "Staff", silo: "BF", sessionId: "s-staff", ...over });
const bodyOf = (path: string) => calls.filter((c) => c.path === path).at(-1)?.body;
const MODEL_IDS = { application_id: "someone-elses-app", applicationId: "x", contact_id: "someone-elses-contact", phone: "+19999999999", session_id: "s-other" };

describe("[154] client and public audiences never take ids or a phone from the model", () => {
  it("client app tools use only the request's application id and the verified phone", async () => {
    // MAYA_v817 - application.checklist and next_step read the portal's to-do list (/api/maya/client-checklist) with the verified phone.
    const TODO_LIST = new Set(["application.checklist", "application.next_step"]);
    for (const tool of ["application.checklist", "application.my_status", "docs.checklist", "docs.rejections", "offer.explain", "application.next_step", "signature.status", "application.resume_link", "pgi.completion_link"]) {
      calls.length = 0;
      await dispatchTool(tool, MODEL_IDS, client());
      const sent = JSON.stringify(calls);
      expect(sent, tool).not.toContain("someone-elses-app");
      expect(sent, tool).not.toContain("+19999999999");
      if (TODO_LIST.has(tool)) expect(bodyOf("/api/maya/client-checklist"), tool).toMatchObject({ application_id: "req-app-1", phone: "+15875550100" });
      else expect(bodyOf("/api/maya/staff/application-summary")?.application_id, tool).toBe("req-app-1");
    }
  });

  it("with no request id it uses the id find_mine resolved for this verified client, and drops the model's", async () => {
    await dispatchTool("application.find_mine", MODEL_IDS, client({ applicationId: null }));
    expect(bodyOf("/api/maya/staff/applications-by-phone")).toMatchObject({ phone: "+15875550100", session_id: "s-client" });
    expect(getResolvedApplicationId(sessionKey("client", "+15875550100", "s-client"))).toBe(APP_ID);
    calls.length = 0;
    await dispatchTool("application.my_status", MODEL_IDS, client({ applicationId: null }));
    expect(bodyOf("/api/maya/staff/application-summary")?.application_id).toBe(APP_ID);
  });

  it("with nothing trusted it calls no application at all", async () => {
    const out = JSON.parse(await dispatchTool("application.my_status", MODEL_IDS, client({ applicationId: null, sessionId: "s-new" })));
    expect(out.ok).toBe(false);
    expect(calls.length).toBe(0);
  });

  it("find_mine never uses a model phone, even when the context has none", async () => {
    await dispatchTool("application.find_mine", { phone: "+19999999999" }, client({ phone: null }));
    expect(JSON.stringify(calls)).not.toContain("+19999999999");
  });

  it("an empty model phone does not beat the verified one (v448)", async () => {
    await dispatchTool("application.find_mine", { phone: "" }, client());
    expect(bodyOf("/api/maya/staff/applications-by-phone")?.phone).toBe("+15875550100");
  });

  it("a visitor's request carries no application id even if the model or body sends one", async () => {
    await dispatchTool("book.callback", { ...MODEL_IDS, reason: "rates" }, visitor({ applicationId: "body-app" }));
    const sent = bodyOf("/api/maya/escalate");
    expect(sent.application_id).toBeNull();
    expect(sent.contact).toEqual({ phone: null, email: null });
    expect(JSON.stringify(sent)).not.toContain("someone-elses");
  });

  it("a visitor's own contact capture keeps the phone they typed (never used to look anyone up)", async () => {
    await dispatchTool("visitor.identify", { name: "Dana Lee", phone: "+17805550111", application_id: "x", contact_id: "y" }, visitor());
    const sent = bodyOf("/api/crm/startup-waitlist");
    expect(sent).toMatchObject({ name: "Dana Lee", phone: "+17805550111" });
    expect(JSON.stringify(sent)).not.toContain('"x"');
  });
});

describe("[161] handoffs: identity from the verified context only, one per session per 10 minutes", () => {
  it("escalate.to_human sends the verified phone, contact and application, never the model's", async () => {
    const out = JSON.parse(await dispatchTool("escalate.to_human", { summary: "wants a person", ...MODEL_IDS, email: "evil@example.com" }, client({ contactId: "contact-verified" })));
    expect(out.ok).toBe(true);
    const sent = bodyOf("/api/communications/maya-handoff");
    expect(sent).toMatchObject({ phone: "+15875550100", applicationId: "req-app-1", contactId: "contact-verified", sessionId: "s-client", email: null });
    expect(JSON.stringify(sent)).not.toContain("evil@example.com");
  });

  it("a visitor handoff carries what they typed as providedContact, not as a phone to match", async () => {
    rememberProvidedContact(sessionKey("visitor", "v-1", "s-visitor"), { name: "Dana", phone: "+17805550111" });
    await dispatchTool("escalate.to_human", { summary: "help", phone: "+19999999999" }, visitor());
    const sent = bodyOf("/api/communications/maya-handoff");
    expect(sent.phone).toBeNull();
    expect(sent.contactId).toBeNull();
    expect(sent.providedContact).toEqual({ name: "Dana", phone: "+17805550111", email: null });
  });

  it("allows one handoff per session per 10 minutes", async () => {
    const first = JSON.parse(await dispatchTool("escalate.to_human", { summary: "1" }, client()));
    const second = JSON.parse(await dispatchTool("escalate.to_human", { summary: "2" }, client()));
    const callback = JSON.parse(await dispatchTool("book.callback", { reason: "3" }, client()));
    expect(first.ok).toBe(true);
    expect(second).toMatchObject({ ok: true, already_notified: true });
    expect(callback.already_notified).toBe(true);
    expect(calls.filter((c) => c.path === "/api/communications/maya-handoff").length).toBe(1);
    // another session is not affected
    await dispatchTool("escalate.to_human", { summary: "other" }, client({ sessionId: "s-2" }));
    expect(calls.filter((c) => c.path === "/api/communications/maya-handoff").length).toBe(2);
  });

  it("a failed handoff does not use up the window", async () => {
    useFake({ "/api/communications/maya-handoff": new Response("no", { status: 500 }) });
    expect(JSON.parse(await dispatchTool("escalate.to_human", { summary: "1" }, client())).ok).toBe(false);
    useFake();
    expect(JSON.parse(await dispatchTool("escalate.to_human", { summary: "2" }, client())).ok).toBe(true);
  });
});

describe("[163] every staff tool gets silo and role from the verified context", () => {
  const ARGS: Record<string, Record<string, unknown>> = {
    "contact.find": { query: "Dana" }, "notes.read": { contact_id: "c1" }, "crm.add_note": { contact_id: "c1", body: "hi" },
    "crm.notes": { contact_id: "c1" }, "crm.tasks": { contact_id: "c1" }, "crm.create_task": { contact_id: "c1", title: "t" },
    "contact.timeline": { contact_id: "c1" }, "contact.picture": { contact_id: "c1" }, "application.summary": { application_id: "a1" },
    "application.risk_flags": { application_id: "a1" }, "banking.summary": { application_id: "a1" }, "credit.summary": { application_id: "a1" },
    "docs.request_draft": { application_id: "a1" }, "application.underwriting_summary": { application_id: "a1" }, "lender.match_explain": { application_id: "a1" },
    "pgi.readiness": { application_id: "a1" }, "todo.status": { application_id: "a1" }, "comm.draft_email": { to: "a@b.co", subject: "s", body: "b" },
    "comm.send_sms": { contact_id: "c1", body: "hi" }, "call.initiate": { contact_id: "c1" }, "pipeline.query": { question: "oldest active application" },
    "marketing.send_campaign": { channel: "email", subject: "s", html: "<p>x</p>" }, "ads.negatives.add": { campaign: "111", terms: ["student loan"] },
    "ads.negatives.remove": { id: "neg_1" },
  };
  const staffTools = TOOLS_BY_AUDIENCE.staff.filter((t) => t !== "pending.confirm" && t !== "ui.navigate");

  it("model-supplied silo and role are ignored for all of them", async () => {
    for (const tool of staffTools) {
      calls.length = 0;
      await dispatchTool(tool, { silo: "SLF", role: "Admin", ...(ARGS[tool] ?? {}) }, staff({ silo: "BI", staffRole: "Staff" }));
      const posts = calls.filter((c) => c.path.startsWith("/api/maya/") && c.method === "POST");
      expect(posts.length, tool).toBeGreaterThan(0);
      for (const c of posts) {
        expect(c.body.silo, `${tool} ${c.path}`).toBe("BI");
        expect(c.body.role, `${tool} ${c.path}`).toBe("Staff");
      }
    }
  });

  it("defaults the silo to BF when the context has none", async () => {
    await dispatchTool("call.triage", { silo: "SLF" }, staff({ silo: null }));
    expect(bodyOf("/api/maya/staff/call-triage").silo).toBe("BF");
  });

  it("the per-staff fields are the verified staff member's", async () => {
    await dispatchTool("comms.overview", { user_email: "someone@else.com" }, staff());
    expect(bodyOf("/api/maya/staff/comms-overview").user_email).toBe("todd@boreal.financial");
    await dispatchTool("comm.send_sms", { contact_id: "c1", body: "hi", staff_user_id: "evil", approved: true }, staff());
    expect(bodyOf("/api/maya/staff/send-sms").staff_user_id).toBe("u-7");
    expect("approved" in bodyOf("/api/maya/staff/send-sms")).toBe(false);
  });
});

describe("resolved application cache (v431)", () => {
  it("extracts the id from a find_mine result", () => {
    expect(applicationIdFromFindMine({ ok: true, applications: [{ id: "d5aa4b1e" }] })).toBe("d5aa4b1e");
    expect(applicationIdFromFindMine({ ok: true, applications: [] })).toBeNull();
    expect(applicationIdFromFindMine(null)).toBeNull();
  });
  it("ignores empty input", () => {
    rememberResolvedApplicationId("", "app-x");
    rememberResolvedApplicationId("k4", "");
    expect(getResolvedApplicationId("k4")).toBeNull();
    expect(getResolvedApplicationId("")).toBeNull();
  });
});
