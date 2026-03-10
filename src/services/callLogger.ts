import { bfServerRequest } from "../integrations/bfServerClient";

export async function logCall(sessionId: string, transcript: string) {
  await bfServerRequest("/api/calls/log", "POST", { sessionId, transcript });
}

export async function logCallSummary(callSid: string, summary: string, score: number) {
  await bfServerRequest("/api/calls/log", "POST", { callSid, summary, score });
}
