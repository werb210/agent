import { pool } from "../db";

export async function logPIIAccess(userId: string, field: string, entityId: string) {
  await pool.query(
    `INSERT INTO maya_audit_log
     (correlation_id, agent_name, action_type, entity_type, entity_id, metadata)
     VALUES (gen_random_uuid(),'Compliance','pii_access','session',$1,$2)`,
    [entityId, { userId, field }]
  );
}
