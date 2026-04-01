import { pool } from "../db";

const executedToolKeys = new Set<string>();

export async function executeTool(
  callId: string,
  toolName: string,
  payload: unknown,
  fn: () => Promise<unknown>
) {
  const idempotencyKey = `${callId}:${toolName}:${JSON.stringify(payload)}`;

  if (executedToolKeys.has(idempotencyKey)) {
    return { skipped: true, idempotencyKey };
  }

  let attempts = 0;

  while (attempts < 3) {
    try {
      const result = await fn();
      executedToolKeys.add(idempotencyKey);
      await pool.query("INSERT INTO maya_tool_log(call_id, tool_name, payload) VALUES ($1, $2, $3)", [
        callId,
        toolName,
        payload
      ]);
      return result;
    } catch (err) {
      attempts += 1;
      if (attempts >= 3) {
        await pool.query("INSERT INTO maya_dead_letter(job_type, payload, error) VALUES ($1, $2, $3)", [
          "maya_tool",
          { callId, toolName, payload },
          String(err)
        ]);
        throw err;
      }
    }
  }
}

export function clearExecutedToolKeys() {
  executedToolKeys.clear();
}
