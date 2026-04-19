import { PredictivePayload } from "./lenderMatchEngine.js";
import { calculateDealPriority } from "./dealPriorityEngine.js";

type StrategicPayload = PredictivePayload & {
  product_type?: string;
  industry?: string;
};

export async function advancedStrategicDecision(payload: StrategicPayload) {
  const priority = await calculateDealPriority({
    funding_amount: payload.funding_amount,
    annual_revenue: payload.annual_revenue,
    time_in_business: payload.time_in_business
  });

  return {
    ...priority,
    recommended_action:
      priority.priority === "high"
        ? "assign_top_broker"
        : "automated_nurture_sequence"
  };
}

export const strategicDecision = advancedStrategicDecision;
