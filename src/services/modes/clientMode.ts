import { MayaRequest, MayaResponse } from "../../types/maya";
import { buildClientContext } from "../../context/buildClientContext";

export async function handleClientMode(
  body: MayaRequest
): Promise<MayaResponse> {
  const context = await buildClientContext(body.sessionId);

  if (!context) {
    return {
      reply: "Hello. How can I help you today?",
      confidence: 0.5,
      escalated: false
    };
  }

  return {
    reply: `Hello ${context.name}. Your application status is ${context.status}.`,
    confidence: 0.7,
    escalated: false
  };
}
