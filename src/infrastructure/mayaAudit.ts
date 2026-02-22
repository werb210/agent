import { createCorrelationId, logAudit as logStructuredAudit } from "../core/auditLogger";

export async function logAudit(actor: string, action: string, metadata: unknown) {
  await logStructuredAudit({
    correlationId: createCorrelationId(),
    agentName: actor,
    actionType: action,
    metadata
  });
}
