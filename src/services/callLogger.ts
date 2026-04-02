import { callBFServer } from "../integrations/bfServerClient";

export async function logCall(sessionId: string, transcript: string) {
  await callBFServer("/api/calls/log",  { sessionId, transcript });
}

export async function logCallSummary(callSid: string, summary: string, score: number) {
  await callBFServer("/api/calls/log",  { callSid, summary, score });
}
