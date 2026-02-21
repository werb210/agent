import { PredictivePayload, predictiveLenderScore } from "./lenderMatchEngine";

export async function calculateDealPriority(payload: PredictivePayload) {
  const lenderScore = await predictiveLenderScore(payload);

  const priority =
    lenderScore > 5
      ? "high"
      : lenderScore > 3
      ? "medium"
      : "low";

  return {
    lenderScore,
    priority
  };
}
