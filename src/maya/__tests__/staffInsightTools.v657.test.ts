// AGENT_MAYA_INSIGHTS_v657
import { beforeEach, describe, expect, it, vi } from "vitest";

const callBFServer = vi.fn();
vi.mock("../../integrations/bfServerClient.js", () => ({ callBFServer: (...args: unknown[]) => callBFServer(...args) }));

import * as tools from "../tools/staffInsightTools.js";
import { TOOL_REGISTRY } from "../toolRegistry.js";
import { isToolAllowed } from "../audience.js";

const NAMES = ["ads.performance", "comms.overview", "contact.picture", "automations.overview", "referrers.overview", "todo.status"];

describe("v657 Maya insight tools", () => {
  beforeEach(() => { callBFServer.mockReset(); callBFServer.mockResolvedValue({ ok: true, summary: "x" }); });
  it("are registered and staff-only", () => {
    for (const name of NAMES) {
      expect(TOOL_REGISTRY[name]?.descriptor.function.name).toBe(name);
      expect(isToolAllowed("staff", name)).toBe(true);
      expect(isToolAllowed("client", name)).toBe(false);
      expect(isToolAllowed("visitor", name)).toBe(false);
    }
  });
  it("call the matching BF-Server endpoints", async () => {
    await tools.adsPerformance({ days: 14 });
    expect(callBFServer).toHaveBeenLastCalledWith("/api/maya/staff/ads-performance", { method: "POST", body: { days: 14, session_id: undefined } });
    await tools.commsOverview({ silo: "BF", user_email: "todd.w@boreal.financial" });
    expect(callBFServer).toHaveBeenLastCalledWith("/api/maya/staff/comms-overview", { method: "POST", body: { silo: "BF", user_email: "todd.w@boreal.financial", session_id: undefined } });
    await tools.contactPicture({ company_id: "co1" }); expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/contact-picture");
    await tools.automationsOverview({}); expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/automations-overview");
    await tools.referrersOverview({}); expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/referrers-overview");
    await tools.todoStatus({ application_id: "a1" });
    expect(callBFServer.mock.lastCall?.[1]).toEqual({ method: "POST", body: { application_id: "a1", session_id: undefined } });
  });
  it("validate ids and never throw", async () => {
    expect(await tools.contactPicture({})).toEqual({ ok: false, error: "contact_id_or_company_id_required" });
    expect(await tools.todoStatus({})).toEqual({ ok: false, error: "application_id_required" });
    callBFServer.mockRejectedValueOnce(new Error("down"));
    expect(await tools.adsPerformance({})).toEqual({ ok: false, error: "request_failed" });
    expect(callBFServer).toHaveBeenCalledTimes(1);
  });
});
