import { createCorrelationId, logAudit } from "./auditLogger";
import { requireCapability } from "../security/capabilityGuard";

const allowedTransitions: Record<string, string[]> = {
  new: ["qualifying"],
  qualifying: ["qualified", "archived"],
  qualified: ["booked", "submitted", "archived"],
  booked: ["submitted", "archived"],
  submitted: ["funded", "declined", "archived"],
  funded: ["archived"],
  declined: ["archived"],
  archived: []
};

export function validateStateTransition(current: string, next: string, role: string = "system") {
  requireCapability(role, "state_transition");
  if (!allowedTransitions[current]?.includes(next)) {
    throw new Error(`Invalid state transition from ${current} to ${next}`);
  }
}

export async function auditStateTransition({
  sessionId,
  currentState,
  newState,
  correlationId,
  agentName
}: {
  sessionId: string;
  currentState: string;
  newState: string;
  correlationId?: string;
  agentName?: string;
}) {
  await logAudit({
    correlationId: correlationId || createCorrelationId(),
    agentName: agentName || "System",
    actionType: "state_transition",
    entityType: "session",
    entityId: sessionId,
    previousValue: { state: currentState },
    newValue: { state: newState }
  });
}
