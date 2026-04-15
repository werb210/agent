import { callBFServer } from "../../integrations/bfServerClient";

export async function evaluateQualification(sessionId: string, userSpeech: string) {
  let score = 0;
  let intent = null;
  let escalation = null;

  const lower = userSpeech.toLowerCase();

  // Basic intent detection
  if (lower.includes("loan") || lower.includes("funding")) {
    intent = "funding_interest";
    score += 20;
  }

  if (lower.includes("revenue") || lower.includes("sales")) {
    score += 20;
  }

  if (lower.includes("years") || lower.includes("in business")) {
    score += 15;
  }

  if (lower.includes("how much") || lower.includes("need")) {
    score += 15;
  }

  if (lower.includes("credit score")) {
    score += 10;
  }

  // Escalation threshold
  if (score >= 50) {
    escalation = "high_intent";
  }

  await callBFServer("/api/crm/events", {
    eventType: "qualification_scored",
    sessionId,
    score,
    intent,
    escalation,
    userSpeech,
  });

  return { score, intent, escalation };
}
