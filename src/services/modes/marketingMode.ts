import { MayaRequest, MayaResponse } from "../../types/maya";

export async function handleMarketingMode(
  body: MayaRequest
): Promise<MayaResponse> {
  return {
    reply: "Marketing mode active. Metrics layer not yet attached.",
    confidence: 0.6,
    escalated: false
  };
}
