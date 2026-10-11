// AGENT_v789_SESSION_KEY - every per-session store (history, the resolved application id,
// pending confirmations, handoff limits, token budgets) is keyed by audience + the verified
// subject from X-Maya-Context + the session id. A session id on its own never loads
// another person's data: the same id under a different subject is a different session.
import type { MayaAudience } from "./audience.js";

export function sessionKey(audience: MayaAudience, subject: string | null | undefined, sessionId: string | null | undefined): string {
  const sid = typeof sessionId === "string" ? sessionId.trim() : "";
  if (!sid) return "";
  const who = typeof subject === "string" && subject.trim() ? subject.trim().toLowerCase() : "anon";
  return `${audience}|${who}|${sid}`;
}
