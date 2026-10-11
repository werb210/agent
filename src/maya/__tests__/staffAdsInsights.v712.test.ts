// AGENT_MAYA_ADS_INSIGHTS_v712
import { beforeEach, describe, expect, it, vi } from "vitest";

const callBFServer = vi.fn();
vi.mock("../../integrations/bfServerClient.js", () => ({ callBFServer: (...args: unknown[]) => callBFServer(...args) }));

import * as tools from "../tools/staffAdsTools.js";
import { TOOL_REGISTRY } from "../toolRegistry.js";
import { isToolAllowed } from "../audience.js";

const NAMES = ["ads.story", "ads.visitors", "ads.dropoff", "ads.health", "ads.ga4", "ads.audiences"];

describe("v712 Maya Ads report tools", () => {
  beforeEach(() => { callBFServer.mockReset(); callBFServer.mockResolvedValue({ ok: true }); });

  it("are registered and staff-only", () => {
    for (const name of NAMES) {
      expect(TOOL_REGISTRY[name]?.descriptor.function.name).toBe(name);
      expect(isToolAllowed("staff", name)).toBe(true);
      expect(isToolAllowed("client", name)).toBe(false);
      expect(isToolAllowed("visitor", name)).toBe(false);
    }
  });

  it("call the matching BF-Server staff endpoints", async () => {
    await tools.adsStory({ days: 30, by: "keyword" });
    expect(callBFServer).toHaveBeenLastCalledWith("/api/maya/staff/ads-story", { method: "POST", body: { days: 30, by: "keyword", session_id: undefined } });
    await tools.adsVisitors({ filter: "ad" });
    expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/ads-visitors");
    await tools.adsDropoff({});
    expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/ads-dropoff");
    await tools.adsHealth({});
    expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/ads-health");
    await tools.adsGa4({ days: 7 });
    expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/ga4");
    await tools.adsAudiences({});
    expect(callBFServer.mock.lastCall?.[0]).toBe("/api/maya/staff/ads-audiences");
  });

  // AGENT_v789: the ad rules are checked on the live staff prompt in src/api/__tests__/mayaRoute.v789.test.ts.
});
