import { getDynamicEscalationThreshold } from "./adaptiveThreshold";

interface ConfidenceInput {
  aiConfidence: number;
  stage: string;
  message: string;
  violationDetected: boolean;
  bookingConversionRate?: number;
}

export function evaluateConfidence(input: ConfidenceInput) {
  let score = input.aiConfidence ?? 0.5;

  const lower = input.message.toLowerCase();

  // Reduce confidence for complex financial topics
  if (
    lower.includes("approval") ||
    lower.includes("guarantee") ||
    lower.includes("tax strategy") ||
    lower.includes("legal advice")
  ) {
    score -= 0.25;
  }

  // Reduce confidence during qualification stage
  if (input.stage === "qualifying") {
    score -= 0.1;
  }

  // Hard compliance violation
  if (input.violationDetected) {
    score = 0;
  }

  // Clamp range
  score = Math.max(0, Math.min(1, score));

  const dynamicThreshold = getDynamicEscalationThreshold(input.bookingConversionRate ?? 0.5);

  return {
    score,
    dynamicThreshold,
    shouldEscalate: score < dynamicThreshold
  };
}
