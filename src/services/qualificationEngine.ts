import { SessionStage } from "../types/stages";

export function determineNextStage(
  currentStage: SessionStage,
  message: string
): SessionStage {
  const lower = message.toLowerCase();

  if (currentStage === "new") {
    return "qualifying";
  }

  if (currentStage === "qualifying") {
    if (
      lower.includes("revenue") ||
      lower.includes("years in business") ||
      lower.includes("monthly sales")
    ) {
      return "collecting_docs";
    }
  }

  if (currentStage === "collecting_docs") {
    if (lower.includes("book") || lower.includes("schedule")) {
      return "booking";
    }
  }

  return currentStage;
}
