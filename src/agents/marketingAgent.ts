import { MayaAgent } from "./baseAgent";
import { capitalEfficiencyIndex } from "../core/capitalEfficiency";
import type { MayaAgent as RegistryAgent } from "./agentRegistry";
import type { MarketingAgentResult, MayaAgentPayload } from "./agentTypes";

export class MarketingAgent implements MayaAgent {
  name = "MarketingAgent";
  role = "Campaign Optimization & ROI";

  async execute() {
    const efficiency = await capitalEfficiencyIndex();

    return {
      capital_efficiency_index: efficiency,
      recommendation:
        efficiency < 2 ? "adjust_campaign_spend"
        : "scale_high_performance_channels"
    };
  }
}

export const marketingAgent: RegistryAgent<MayaAgentPayload, MarketingAgentResult> = {
  async execute(input: MayaAgentPayload): Promise<MarketingAgentResult> {
    const roiProjection = input.industry === "Construction" ? 3.2 : 2.4;

    return {
      projected_roi: roiProjection,
      suggested_budget: roiProjection > 3 ? 20000 : 10000
    };
  }
};
