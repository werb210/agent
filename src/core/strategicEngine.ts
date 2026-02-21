import { MayaAgentPayload } from "../agents/agentTypes";
import { runMayaAgents } from "../agents/orchestrator";
import { simulateRevenue } from "./revenueSimulator";

export async function strategicDecision(payload: MayaAgentPayload) {
  const agentResults = await runMayaAgents(payload);

  const simulation = await simulateRevenue({
    funding_amount: payload.funding_amount,
    risk_score: agentResults.risk.risk_score
  });

  return {
    ...agentResults,
    simulation,
    recommended_strategy:
      agentResults.sales.likelihood > 0.8
        ? "assign_senior_broker"
        : "nurture_sequence"
  };
}
