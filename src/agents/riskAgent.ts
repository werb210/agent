import { MayaAgent } from "./agentRegistry";
import { MayaAgentPayload, RiskAgentResult } from "./agentTypes";

export const riskAgent: MayaAgent<MayaAgentPayload, RiskAgentResult> = {
  async execute(input: MayaAgentPayload): Promise<RiskAgentResult> {
    const timeInBusiness = input.time_in_business ?? 0;
    const riskScore = timeInBusiness < 2 ? 0.75 : 0.35;

    return {
      risk_score: riskScore,
      risk_level: riskScore > 0.6 ? "high" : "moderate"
    };
  }
};
