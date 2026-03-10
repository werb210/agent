import { MayaAction } from "../types/actions";

export function interpretAction(aiReply: string): MayaAction {
  try {
    const parsed = JSON.parse(aiReply) as { tool?: string };
    if (parsed.tool === "scheduleAppointment") {
      return { type: "book", requiresConfirmation: true };
    }
    if (parsed.tool === "transferCall") {
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
