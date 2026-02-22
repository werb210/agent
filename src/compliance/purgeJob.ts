import { pool } from "../db";

const RETENTION_TABLES = new Set(["sessions"]);

export async function runRetentionPurge() {
  const policies = await pool.query(`SELECT * FROM maya_retention_policy`);

  for (const policy of policies.rows) {
    if (!RETENTION_TABLES.has(policy.entity_type)) {
      continue;
    }

    await pool.query(`
      DELETE FROM ${policy.entity_type}
      WHERE created_at < NOW() - INTERVAL '${policy.retention_days} days'
      AND state='archived'
    `);
  }
}
