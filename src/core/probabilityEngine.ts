import { getMLApprovalProbability } from "./mlClient";
import { validateQualificationInput } from "./inputValidator";

export async function calculateFundingProbability(payload: any) {
  validateQualificationInput(payload);

  try {
    const prob = await getMLApprovalProbability(payload);
    return prob;
  } catch {
    return 0.5; // fallback
  }
}
