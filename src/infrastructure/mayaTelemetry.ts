import { pool } from "../db";

export async function logLLMUsage(model: string, task: string) {
  await pool.query(
    `
    INSERT INTO maya_audit_log (actor, action, metadata)
    VALUES ('maya', 'llm_usage', $1)
  `,
    [
      {
        model,
        task,
        timestamp: new Date()
      }
    ]
  );
}
