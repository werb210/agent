import { execute, ToolExecutionCall } from "../ai/toolExecutor";
import { performance } from "node:perf_hooks";

const activeCalls = new Set<string>();
const completedCalls = new Set<string>();

type AgentRunResponse = Readonly<{
  status: "ok" | "error";
  data?: Record<string, unknown>;
  error?: { code: string; message?: string };
  meta: { callId: string; durationMs: number };
}>;

export async function runAgent(call: ToolExecutionCall): Promise<AgentRunResponse> {
  if (!call || typeof call.callId !== "string" || !call.callId.trim()) {
    throw new Error("INVALID_CALL_ID INVALID_CALL_INPUT");
  }

  if (completedCalls.has(call.callId)) {
    throw new Error("CALL_ALREADY_COMPLETED");
  }

  if (activeCalls.has(call.callId)) {
    throw new Error("DUPLICATE_CALL");
  }

  activeCalls.add(call.callId);
  const startTime = performance.now();

  try {
    const result = await execute(call);

    if (!result || !result.status) {
      return Object.freeze({
        status: "error",
        error: { code: "INVALID_AGENT_RESULT", message: "Missing result status" },
        meta: {
          callId: call.callId,
          durationMs: Math.round(performance.now() - startTime)
        }
      });
    }

    const output: AgentRunResponse = {
      status: result.status,
      data: result.data,
      error: result.error,
      meta: {
        callId: call.callId,
        durationMs: Math.round(performance.now() - startTime)
      }
    };

    completedCalls.add(call.callId);
    return Object.freeze(output);
  } finally {
    activeCalls.delete(call.callId);
  }
}
