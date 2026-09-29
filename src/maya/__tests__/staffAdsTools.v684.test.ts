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

  it("adds negatives as a preview unless confirm is exactly true", async () => {
    await tools.adsNegativesAdd({ campaign: "BF Search - US", terms: ["free grants"] });
    expect(callBFServer).toHaveBeenLastCalledWith("/api/maya/staff/ads-negatives/add", { method: "POST", body: { campaign: "BF Search - US", terms: ["free grants"], match_type: undefined, confirm: false, confirm_token: undefined, session_id: undefined } });
    await tools.adsNegativesAdd({ campaign: "BF Search - US", terms: ["free grants"], confirm: true, confirm_token: "t" });
    expect(callBFServer.mock.lastCall?.[1].body).toMatchObject({ confirm: true, confirm_token: "t" });
    expect(await tools.adsNegativesAdd({ terms: ["x"] })).toEqual({ ok: false, error: "campaign_required" });
    expect(await tools.adsNegativesRemove({})).toEqual({ ok: false, error: "id_or_term_required" });
  });

  it("the tool descriptions demand the two-step confirmation", () => {
    for (const d of [tools.ADS_NEGATIVES_ADD_TOOL_DESCRIPTOR, tools.ADS_NEGATIVES_REMOVE_TOOL_DESCRIPTOR]) expect(d.function.description).toContain("ALWAYS two steps");
  });
});
