import { MayaAction } from "../types/actions";

export function interpretAction(
  aiReply: string
): MayaAction {

  const lower = aiReply.toLowerCase();

  if (lower.includes("pipeline summary")) {
    return {
      type: "staff_pipeline_summary",
      requiresConfirmation: false
    };
  }

  if (lower.includes("applications in")) {
    const match = lower.match(/applications in\s+([a-z_\- ]+)/);
    const status = match?.[1]?.trim();

    return {
      type: "staff_applications_by_status",
      requiresConfirmation: false,
      payload: status ? { status } : undefined
    };
  }

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

  if (lower.includes("status of my application")) {
    return {
      type: "qualify",
      requiresConfirmation: false
    };
  }

  if (lower.includes("rates") || lower.includes("loc rate")) {
    return {
      type: "none",
      requiresConfirmation: false,
      payload: { dataQuery: "rates" }
    };
  }

  return {
    type: "none",
    requiresConfirmation: false
  };
}
