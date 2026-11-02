// AGENT_v868_ACTING_STAFF - every staff tool call tells BF-Server who is acting: the verified staff member's id in the
// body and BF-Server's own signed X-Maya-Context in a header, so BF-Server can apply that person's record visibility.
// Client and visitor calls carry neither. The model can never choose the id.
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { dispatchTool, type DispatchContext } from "../dispatch.js";
import { TOOLS_BY_AUDIENCE } from "../audience.js";
import { _clearHandoffState } from "../handoff.js";
import { runInStaffScope } from "../../lib/staffScope.js";
import { callBFServer } from "../../integrations/bfServerClient.js";
import { createBfServerFake, type FakeCall } from "../../../test/bfServerFake.js";
import { ask, startMayaRouter, toolCall, type Started } from "../../../test/mayaHarness.js";

const realFetch = globalThis.fetch;
let calls: FakeCall[] = [];
function useFake() {
  const fake = createBfServerFake();
  calls = fake.calls;
  globalThis.fetch = fake.fetch;
}
beforeEach(() => {
  process.env.JWT_SECRET = "acting-staff-test-secret";
  process.env.SERVER_URL = process.env.SERVER_URL || "http://bf-server.test";
  _clearHandoffState();
  useFake();
});
afterEach(() => { globalThis.fetch = realFetch; });

const CTX_TOKEN = "signed.context.token";
const staff = (over: Partial<DispatchContext> = {}): DispatchContext => ({
  audience: "staff", subject: "u-7", staffId: "u-7", staffEmail: "sam@acme.example", staffRole: "Staff", silo: "BF", sessionId: "s-staff", mayaContext: CTX_TOKEN, ...over,
});
const ARGS: Record<string, Record<string, unknown>> = {
  "contact.find": { query: "Dana" }, "notes.read": { contact_id: "c1" }, "crm.add_note": { contact_id: "c1", body: "hi" },
  "crm.notes": { contact_id: "c1" }, "crm.tasks": { contact_id: "c1" }, "crm.create_task": { contact_id: "c1", title: "t" },
  "contact.timeline": { contact_id: "c1" }, "contact.picture": { contact_id: "c1" }, "application.summary": { application_id: "a1" },
  "application.risk_flags": { application_id: "a1" }, "banking.summary": { application_id: "a1" }, "credit.summary": { application_id: "a1" },
  "docs.request_draft": { application_id: "a1" }, "application.underwriting_summary": { application_id: "a1" }, "lender.match_explain": { application_id: "a1" },
  "todo.status": { application_id: "a1" }, "comm.draft_email": { to: "a@b.co", subject: "s", body: "b" },
  "comm.send_sms": { contact_id: "c1", body: "hi" }, "call.initiate": { contact_id: "c1" }, "pipeline.query": { question: "oldest active application" },
  "marketing.send_campaign": { channel: "email", subject: "s", html: "<p>x</p>" }, "ads.negatives.add": { campaign: "111", terms: ["student loan"] },
  "ads.negatives.remove": { id: "neg_1" },
};

describe("staff tools carry the acting staff member", () => {
  const staffTools = TOOLS_BY_AUDIENCE.staff.filter((t) => t !== "pending.confirm" && t !== "ui.navigate");

  it("every staff tool sends the verified id and the signed context, never the model's id", async () => {
    let reached = 0;
    for (const tool of staffTools) {
      calls.length = 0;
      await dispatchTool(tool, { staff_user_id: "someone-else", user_id: "x", ...(ARGS[tool] ?? {}) }, staff());
      const toServer = calls.filter((c) => c.path.startsWith("/api/maya/"));
      // Some Boreal staff tools stop at their own argument check or call BI-Server instead; every call that does
      // reach /api/maya/ on BF-Server is checked.
      if (toServer.length > 0) reached += 1;
      for (const c of toServer) {
        expect(c.headers["x-maya-context"], `${tool} ${c.path}`).toBe(CTX_TOKEN);
        if (c.method !== "GET") expect(c.body.staff_user_id, `${tool} ${c.path}`).toBe("u-7");
      }
      expect(JSON.stringify(toServer), tool).not.toContain("someone-else");
    }
    expect(reached).toBeGreaterThanOrEqual(20);
  });

  it("a GET inside a staff tool carries the signed context too", async () => {
    await runInStaffScope({ silo: "BF", role: "Staff", staffUserId: "u-7", context: CTX_TOKEN }, () => callBFServer("/api/maya/staff/lender-products", { method: "GET" }));
    expect(calls.at(-1)?.method).toBe("GET");
    expect(calls.at(-1)?.headers["x-maya-context"]).toBe(CTX_TOKEN);
  });

  it("client and visitor calls carry no staff id and no context", async () => {
    await dispatchTool("application.my_status", { staff_user_id: "u-7" }, { audience: "client", phone: "+15875550100", subject: "+15875550100", sessionId: "s-c", applicationId: "req-app-1" });
    await dispatchTool("lender.products", { staff_user_id: "u-7" }, { audience: "visitor", subject: "v-1", sessionId: "s-v" });
    expect(calls.length).toBeGreaterThan(0);
    for (const c of calls) {
      expect(c.headers["x-maya-context"], c.path).toBeUndefined();
      expect(c.body?.staff_user_id, c.path).toBeUndefined();
    }
  });

  it("outside a staff tool nothing is added", async () => {
    await callBFServer("/api/maya/staff/application-summary", { method: "POST", body: { application_id: "a1" } }).catch(() => null);
    expect(calls.at(-1)?.headers["x-maya-context"]).toBeUndefined();
    expect(calls.at(-1)?.body?.staff_user_id).toBeUndefined();
  });
});

describe("through /api/maya/message", () => {
  let maya: Started;
  beforeAll(async () => { process.env.JWT_SECRET = "acting-staff-test-secret"; process.env.OPENAI_API_KEY = "test-key"; maya = await startMayaRouter(); });
  afterAll(async () => { globalThis.fetch = realFetch; await maya.close(); });

  it("hands BF-Server back the context it signed for this staff member", async () => {
    const STAFF = { audience: "staff", silo: "BF", staff: { id: "u-9", name: "Sue", email: "sue@acme.example", role: "Staff", phone: null } };
    const r = await ask(maya.base, { message: "find Dana", session_id: "s-ks2" }, STAFF, [toolCall("t1", "contact.find", { query: "Dana", staff_user_id: "u-1" }), { role: "assistant", content: "Found." }]);
    expect(r.status).toBe(200);
    const found = r.calls.filter((c) => c.path.startsWith("/api/maya/staff/"));
    expect(found.length).toBeGreaterThan(0);
    for (const c of found) {
      expect(c.body.staff_user_id).toBe("u-9");
      const claims = jwt.verify(c.headers["x-maya-context"], "acting-staff-test-secret") as any;
      expect(claims).toMatchObject({ kind: "maya_context", audience: "staff", staff: { id: "u-9" } });
    }
  });
});
