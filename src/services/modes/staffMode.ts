import { MayaRequest, MayaResponse } from "../../types/maya";
import { buildStaffContext } from "../../context/buildStaffContext";

export async function handleStaffMode(
  body: MayaRequest
): Promise<MayaResponse> {
  if (!body.contextId) {
    return {
      reply: "Please provide a deal ID.",
      confidence: 0.4,
      escalated: false
    };
  }

  const context = await buildStaffContext(body.contextId);

  if (!context) {
    return {
      reply: "Deal not found.",
      confidence: 0.3,
      escalated: false
    };
  }

  return {
    reply: `Deal ${context.dealId} is Tier ${context.tier} with score ${context.score}.`,
    confidence: 0.7,
    escalated: false
  };
}
