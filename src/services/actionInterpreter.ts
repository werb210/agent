import { MayaAction } from "../types/actions";

export function interpretAction(
  aiReply: string
): MayaAction {

  const lower = aiReply.toLowerCase();

  if (lower.includes("book") || lower.includes("schedule")) {
    return {
      type: "book",
      requiresConfirmation: true
    };
  }

  if (lower.includes("transfer") || lower.includes("connect you")) {
    return {
      type: "transfer",
      requiresConfirmation: true
    };
  }

  if (lower.includes("follow up")) {
    return {
      type: "follow_up",
      requiresConfirmation: false
    };
  }

  if (lower.includes("qualify") || lower.includes("tell me about your business")) {
    return {
      type: "qualify",
      requiresConfirmation: false
    };
  }

  return {
    type: "none",
    requiresConfirmation: false
  };
}
