import { MayaAgent } from "./agentRegistry";
import { MarketingAgentResult, MayaAgentPayload } from "./agentTypes";

export const marketingAgent: MayaAgent<MayaAgentPayload, MarketingAgentResult> = {
  async execute(input: MayaAgentPayload): Promise<MarketingAgentResult> {
    const roiProjection = input.industry === "Construction" ? 3.2 : 2.4;

    return {
      projected_roi: roiProjection,
      suggested_budget: roiProjection > 3 ? 20000 : 10000
    };
  }
};
