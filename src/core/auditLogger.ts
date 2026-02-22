import { randomUUID } from "crypto";
import { pool } from "../db";

type AuditPayload = {
  correlationId: string;
  agentName?: string;
  actionType: string;
  entityType?: string;
  entityId?: string;
  previousValue?: unknown;
  newValue?: unknown;
  metadata?: unknown;
};

export function createCorrelationId() {
  return randomUUID();
}

export async function logAudit({
  correlationId,
  agentName,
  actionType,
  entityType,
  entityId,
  previousValue,
  newValue,
  metadata
}: AuditPayload) {
  await pool.query(
    `INSERT INTO maya_audit_log
     (correlation_id, agent_name, action_type, entity_type, entity_id, previous_value, new_value, metadata)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [
      correlationId,
      agentName ?? null,
      actionType,
      entityType ?? null,
      entityId ?? null,
      previousValue ?? null,
      newValue ?? null,
      metadata ?? {}
    ]
  );
}
