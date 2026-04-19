import { getMLApprovalProbability } from "./mlClient.js";
import { validateQualificationInput } from "./inputValidator.js";

export async function calculateFundingProbability(payload: any, correlationId?: string, role: string = "system") {
  validateQualificationInput(payload);

  try {
    const prob = await getMLApprovalProbability(payload, role, correlationId);
    return prob;
  } catch {
    return 0.5; // fallback
  }
}
