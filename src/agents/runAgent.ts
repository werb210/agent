import { execute, ToolExecutionCall, ToolExecutionResponse } from "../ai/toolExecutor";

const activeCalls = new Set<string>();

export async function runAgent(call: ToolExecutionCall): Promise<Readonly<ToolExecutionResponse & { meta: { callId: string; durationMs: number } }>> {
  if (!call || !call.callId) {
    throw new Error("INVALID_CALL_INPUT");
  }

  if (activeCalls.has(call.callId)) {
    throw new Error("DUPLICATE_CALL");
  }

  activeCalls.add(call.callId);
  const startTime = Date.now();

  try {
    const result = await execute(call);

    if (!result || !result.status) {
      throw new Error("INVALID_EXECUTION_RESULT");
    }

    const output = {
      ...result,
      meta: {
        callId: call.callId,
        durationMs: Date.now() - startTime
      }
    };

    return Object.freeze(output);
  } finally {
    activeCalls.delete(call.callId);
  }
}
