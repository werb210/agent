import { pool } from "../../db";

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

  await pool.query(
    `UPDATE maya_voice_sessions
     SET qualification_score = qualification_score + $1,
         intent = COALESCE(intent, $2),
         escalation = $3
     WHERE id = $4`,
    [score, intent, escalation, sessionId]
  );

  return { score, intent, escalation };
}
