import { pool } from "../db";

export async function logAudit(actor: string, action: string, metadata: unknown) {
  await pool.query(
    `INSERT INTO maya_audit_log (actor, action, metadata)
     VALUES ($1,$2,$3)`,
    [actor, action, metadata]
  );
}
