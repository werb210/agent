import { MayaRequest, MayaResponse } from "../../types/maya";

export async function handleStaffMode(
  body: MayaRequest
): Promise<MayaResponse> {
  return {
    reply: "Staff mode active. Awaiting context integration.",
    confidence: 0.6,
    escalated: false
  };
}
