import { getMLApprovalProbability } from "./mlClient";
import { validateQualificationInput } from "./inputValidator";

export async function calculateFundingProbability(payload: any, correlationId?: string, role: string = "system") {
  validateQualificationInput(payload);

  try {
    const prob = await getMLApprovalProbability(payload, role, correlationId);
    return prob;
  } catch {
    return 0.5; // fallback
  }
}
