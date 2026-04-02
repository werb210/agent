import { MayaAction } from "../types/actions";
import { validateToolCall } from "../core/validateTool";

export function interpretAction(aiReply: string): MayaAction {
  try {
    const parsed = JSON.parse(aiReply) as { tool_call?: unknown; tool?: string };
    const toolCall = parsed.tool_call ? validateToolCall(parsed.tool_call) : null;
    const toolName = toolCall?.name ?? parsed.tool;

    if (toolName === "scheduleAppointment") {
      return { type: "book", requiresConfirmation: true };
    }
    if (toolName === "transferCall") {
      return { type: "transfer", requiresConfirmation: true };
    }
  } catch {
    // no-op: non-JSON responses map to no action
  }

  return {
    type: "none",
    requiresConfirmation: false
  };
}
