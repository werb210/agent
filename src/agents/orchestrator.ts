import { getAgent } from "./agentRegistry";
import { publishAgentMessage } from "./communicationBus";
import {
  MarketingAgentResult,
  MayaAgentPayload,
  RiskAgentResult,
  SalesAgentResult
} from "./agentTypes";

export interface MayaOrchestrationResult {
  sales: SalesAgentResult;
  marketing: MarketingAgentResult;
  risk: RiskAgentResult;
}

function toBusPayload(value: unknown): Record<string, unknown> {
  return (value ?? {}) as Record<string, unknown>;
}

export async function runMayaAgents(payload: MayaAgentPayload): Promise<MayaOrchestrationResult> {
  const sales = await getAgent("sales").execute(payload) as SalesAgentResult;
  publishAgentMessage({
    from: "sales",
    to: "orchestrator",
    topic: "sales.analysis.completed",
    payload: toBusPayload(sales)
  });

  const marketing = await getAgent("marketing").execute(payload) as MarketingAgentResult;
  publishAgentMessage({
    from: "marketing",
    to: "orchestrator",
    topic: "marketing.analysis.completed",
    payload: toBusPayload(marketing)
  });

  const risk = await getAgent("risk").execute(payload) as RiskAgentResult;
  publishAgentMessage({
    from: "risk",
    to: "orchestrator",
    topic: "risk.analysis.completed",
    payload: toBusPayload(risk)
  });

  return {
    sales,
    marketing,
    risk
  };
}
