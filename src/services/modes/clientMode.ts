import { MayaRequest, MayaResponse } from "../../types/maya";

export async function handleClientMode(
  body: MayaRequest
): Promise<MayaResponse> {
  return {
    reply: "Client mode active. Context builder not yet attached.",
    confidence: 0.5,
    escalated: false
  };
}
