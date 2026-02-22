import { getMLApprovalProbability } from "./mlClient";

export async function calculateFundingProbability(payload: any) {
  try {
    const prob = await getMLApprovalProbability(payload);
    return prob;
  } catch {
    return 0.5; // fallback
  }
}
