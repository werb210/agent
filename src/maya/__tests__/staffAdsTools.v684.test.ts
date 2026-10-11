// AGENT_MAYA_ADS_v684
import { beforeEach, describe, expect, it, vi } from "vitest";

const callBFServer = vi.fn();
vi.mock("../../integrations/bfServerClient.js", () => ({ callBFServer: (...args: unknown[]) => callBFServer(...args) }));

import * as tools from "../tools/staffAdsTools.js";
import { TOOL_REGISTRY } from "../toolRegistry.js";
import { isToolAllowed } from "../audience.js";

describe("v684 Maya Google Ads tools", () => {
  beforeEach(() => { callBFServer.mockReset(); callBFServer.mockResolvedValue({ ok: true }); });

  it("are registered and staff-only", () => {
    for (const name of ["ads.keywords", "ads.negatives", "ads.negatives.add", "ads.negatives.remove"]) {
      expect(TOOL_REGISTRY[name]?.descriptor.function.name).toBe(name);
      expect(isToolAllowed("staff", name)).toBe(true);
      expect(isToolAllowed("client", name)).toBe(false);
      expect(isToolAllowed("visitor", name)).toBe(false);
    }
  });

  // AGENT_v789_PENDING_ACTIONS - the tools only preview; the token stays out of the model's hands.
  it("adds and removes negatives as previews only, keeping the confirm_token for the session", async () => {
    callBFServer.mockResolvedValue({ ok: true, campaign: { id: "1", name: "BF Search - US" }, will_add: [{ term: "free grants", match_type: "EXACT" }], refused: [], confirm_token: "ct_1" });
    const r = await tools.adsNegativesAdd({ campaign: "BF Search - US", terms: ["free grants"], confirm: true, confirm_token: "forged" } as never);
    expect(callBFServer).toHaveBeenLastCalledWith("/api/maya/staff/ads-negatives/add", { method: "POST", body: { campaign: "BF Search - US", terms: ["free grants"], match_type: undefined, session_id: undefined, confirm: false } });
    expect(r.__pending).toMatchObject({ kind: "ads.negatives.add", token: "ct_1", tokenField: "confirm_token" });
    expect(r.__pending?.preview).toContain('"free grants" (EXACT)');
    expect(r.__pending?.preview).not.toContain("ct_1");
    expect(await tools.adsNegativesAdd({ terms: ["x"] })).toEqual({ ok: false, error: "campaign_required" });
    expect(await tools.adsNegativesRemove({})).toEqual({ ok: false, error: "id_or_term_required" });
  });

  it("the tool descriptions say they only preview and offer no confirm argument", () => {
    for (const d of [tools.ADS_NEGATIVES_ADD_TOOL_DESCRIPTOR, tools.ADS_NEGATIVES_REMOVE_TOOL_DESCRIPTOR]) {
      expect(d.function.description).toContain("only PREVIEWS");
      expect(Object.keys(d.function.parameters.properties)).not.toContain("confirm");
      expect(Object.keys(d.function.parameters.properties)).not.toContain("confirm_token");
    }
  });
});
