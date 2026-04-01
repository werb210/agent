import { execute, ToolExecutionCall, ToolExecutionResponse } from "../ai/toolExecutor";

export async function runAgent(call: ToolExecutionCall): Promise<ToolExecutionResponse & { meta: { callId: string; durationMs: number } }> {
  if (!call || !call.callId) {
    throw new Error("INVALID_CALL_INPUT");
  }

  const startTime = Date.now();
  const result = await execute(call);

  if (!result || !result.status) {
    throw new Error("INVALID_EXECUTION_RESULT");
  }

  return {
    ...result,
    meta: {
      callId: call.callId,
      durationMs: Date.now() - startTime
    }
  };
}
