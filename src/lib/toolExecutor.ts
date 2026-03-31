import { withRetry } from "./retry";
import { pushDeadLetter } from "./deadLetter";
import { saveEvent } from "./eventStore";

const executedToolKeys = new Set<string>();

export async function executeTool(
  callId: string,
  toolName: string,
  payload: unknown,
  fn: () => Promise<unknown>
) {
  const idempotencyKey = `${callId}:${toolName}:${JSON.stringify(payload)}`;

  if (executedToolKeys.has(idempotencyKey)) {
    await saveEvent({
      callId,
      type: "tool_duplicate_skipped",
      payload: { toolName, payload, idempotencyKey }
    });

    return { skipped: true, idempotencyKey };
  }

  await saveEvent({
    callId,
    type: "tool_attempt",
    payload: { toolName, payload, idempotencyKey }
  });

  try {
    const result = await withRetry(fn);
    executedToolKeys.add(idempotencyKey);

    await saveEvent({
      callId,
      type: "tool_success",
      payload: { toolName, result, idempotencyKey }
    });

    return result;
  } catch (err) {
    const errorText = String(err);

    await saveEvent({
      callId,
      type: "tool_failure",
      payload: { toolName, error: errorText, idempotencyKey }
    });

    await pushDeadLetter({
      type: "maya_tool",
      data: { callId, toolName, payload },
      error: errorText
    });

    throw err;
  }
}

export function clearExecutedToolKeys() {
  executedToolKeys.clear();
}
