import { PredictivePayload } from "./lenderMatchEngine";
import { calculateDealPriority } from "./dealPriorityEngine";

export async function advancedStrategicDecision(payload: PredictivePayload) {
  const priority = await calculateDealPriority(payload);

  return {
    ...priority,
    recommended_action:
      priority.priority === "high"
        ? "assign_top_broker"
        : "automated_nurture_sequence"
  };
}
