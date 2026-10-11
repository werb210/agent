// AGENT_v784_SMS_DRAFT_ONLY + AGENT_v784_PRESENCE_GET + AGENT_v784_SERVICE_TOKEN
import { describe, it, expect, vi, beforeEach } from "vitest";
import jwt from "jsonwebtoken";

const bf = vi.hoisted(() => ({ fn: vi.fn() }));
vi.mock("../integrations/bfServerClient.js", async (orig) => {
  const real: any = await orig();
  return { ...real, callBFServer: (...a: unknown[]) => bf.fn(...a) };
});

process.env.JWT_SECRET = "v784-test-secret-value";
const { commSendSms, COMM_SEND_SMS_TOOL_DESCRIPTOR, SMS_DRAFT_REPLY } = await import("../maya/tools/commSendSms.js");
const { dispatchTool } = await import("../maya/dispatch.js");
const { getAvailableStaff } = await import("../services/staffAvailability.js");
const { signServiceToken, SERVICE_TOKEN_CLAIMS } = await import("../lib/serviceToken.js");

beforeEach(() => bf.fn.mockReset());

describe("comm.send_sms is draft only (v784)", () => {
  it("has no approved flag in the schema", () => {
    expect(Object.keys(COMM_SEND_SMS_TOOL_DESCRIPTOR.function.parameters.properties)).not.toContain("approved");
    expect(JSON.stringify(COMM_SEND_SMS_TOOL_DESCRIPTOR)).not.toContain("approved=true");
  });

  it("returns the draft wording when BF-Server returns pending", async () => {
    bf.fn.mockResolvedValueOnce({ pending: true, pendingId: "p1", preview: { to: "+1555", body: "hi" } });
    const r = await commSendSms({ body: "hi", contact_id: "c1", staff_user_id: "u-1" });
    expect(r).toMatchObject({ ok: true, pending: true, pendingId: "p1", message: SMS_DRAFT_REPLY });
    expect(SMS_DRAFT_REPLY).toBe("Draft ready - press Send in the Maya panel to send it. It has NOT been sent.");
    const [path, opts] = bf.fn.mock.calls[0];
    expect(path).toBe("/api/maya/staff/send-sms");
    expect(opts.method).toBe("POST");
    expect(opts.body.staff_user_id).toBe("u-1");
    expect("approved" in opts.body).toBe(false);
  });

  it("reports a failure when pending is not true", async () => {
    bf.fn.mockResolvedValueOnce({ ok: true, sent: true });
    const r = await commSendSms({ body: "hi", staff_user_id: "u-1" });
    expect(r.ok).toBe(false);
    expect(r.message).not.toContain("Draft ready");
  });

  it("dispatch drops a model-sent approved flag and uses the verified staff id", async () => {
    bf.fn.mockResolvedValueOnce({ pending: true, pendingId: "p2" });
    const out = JSON.parse(await dispatchTool("comm.send_sms", { body: "hi", contact_id: "c1", approved: true, staff_user_id: "evil" }, { audience: "staff", staffId: "u-7" }));
    expect(out.message).toBe(SMS_DRAFT_REPLY);
    const sent = bf.fn.mock.calls[0][1].body;
    expect(sent.staff_user_id).toBe("u-7");
    expect("approved" in sent).toBe(false);
  });
});

describe("client lookup tools use only the verified phone (v784)", () => {
  it("drops a phone the model supplies", async () => {
    bf.fn.mockResolvedValue({ ok: true, applications: [] });
    await dispatchTool("application.find_mine", { phone: "+19999999999" }, { audience: "client", phone: null, sessionId: "s-x" });
    for (const call of bf.fn.mock.calls) expect(JSON.stringify(call)).not.toContain("+19999999999");
    bf.fn.mockClear();
    await dispatchTool("application.find_mine", { phone: "+19999999999" }, { audience: "client", phone: "+15875550100", sessionId: "s-y" });
    const all = JSON.stringify(bf.fn.mock.calls);
    expect(all).not.toContain("+19999999999");
    expect(all).toContain("+15875550100");
  });
});

describe("staff presence (v784)", () => {
  it("uses GET for /api/telephony/presence", async () => {
    bf.fn.mockResolvedValueOnce([{ user_id: "u1", status: "available", twilio_identity: "t1" }, { user_id: "u2", status: "away", twilio_identity: null }]);
    const staff = await getAvailableStaff();
    expect(bf.fn).toHaveBeenCalledWith("/api/telephony/presence", { method: "GET" });
    expect(staff).toEqual([{ userId: "u1", twilioIdentity: "t1" }]);
  });

  it("logs a failure instead of swallowing it", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    bf.fn.mockRejectedValueOnce(new Error("BF-Server error 400 for /api/telephony/presence"));
    expect(await getAvailableStaff()).toEqual([]);
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("staff_presence_failed"));
    spy.mockRestore();
  });
});

describe("service token shape (v784)", () => {
  it("signs the agent service claims with HS256 and a one hour expiry", () => {
    const token = signServiceToken();
    const header = jwt.decode(token, { complete: true })!.header;
    expect(header.alg).toBe("HS256");
    const claims = jwt.verify(token, process.env.JWT_SECRET as string) as Record<string, unknown>;
    expect(claims).toMatchObject({ kind: "service", service: "agent", source: "agent", principal: "service", id: "agent-service", role: "Staff" });
    expect(SERVICE_TOKEN_CLAIMS).toEqual({ kind: "service", service: "agent", source: "agent", principal: "service", id: "agent-service", role: "Staff" });
    expect(Number(claims.exp) - Number(claims.iat)).toBe(3600);
    expect("phone" in claims).toBe(false);
  });

  // AGENT_v789: every outbound call's token is checked in src/__tests__/serviceToken.v789.test.ts.
});
