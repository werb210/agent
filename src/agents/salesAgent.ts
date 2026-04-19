import { MayaAgent } from "./agentRegistry.js";
import { MayaAgentPayload, SalesAgentResult } from "./agentTypes.js";

export const salesAgent: MayaAgent<MayaAgentPayload, SalesAgentResult> = {
  async execute(input: MayaAgentPayload): Promise<SalesAgentResult> {
    const score = input.funding_amount > 500000 ? 0.85 : 0.65;

    return {
      likelihood: score,
      recommended_action: score > 0.8 ? "priority_followup" : "standard_followup"
    };
  }
};
