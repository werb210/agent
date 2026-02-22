import { MayaAgent } from "./baseAgent";
import { calculateFundingProbability } from "../core/probabilityEngine";
import { createCorrelationId, logAudit } from "../core/auditLogger";

export class CreditAgent implements MayaAgent {
  name = "CreditAgent";
  role = "Underwriting & Risk Evaluation";

  async execute(input: any) {
    const correlationId = createCorrelationId();
    const probability = await calculateFundingProbability(input, correlationId);

    await logAudit({
      correlationId,
      agentName: this.name,
      actionType: "credit_evaluation",
      entityType: "session",
      entityId: input.session_id,
      newValue: { probability },
      metadata: { input }
    });

    return {
      approval_probability: probability,
      decision_band:
        probability > 0.75 ? "strong"
        : probability > 0.5 ? "moderate"
        : "weak"
    };
  }
}
