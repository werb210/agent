import { queryDb } from "../lib/db";
import { logToolCall, logToolError, logToolResult } from "../lib/logger";
import { createLead, startCall, updateCallStatus } from "../tools";
import { TOOL_REGISTRY, ToolRegistryName } from "../tools/registry";

export type ToolExecutionResult = Record<string, unknown>;

export type ToolExecutionCall = {
  callId: string;
  name: string;
  params: Record<string, unknown>;
  fnOrToken: (() => Promise<unknown>) | string;
};

export type ToolExecutionResponse =
  | { status: "ok"; data: ToolExecutionResult }
  | { status: "error"; error: { code: "EXEC_FAIL"; message: string } };

const allowedTools: ToolRegistryName[] = [
  TOOL_REGISTRY.createLead,
  TOOL_REGISTRY.startCall,
  TOOL_REGISTRY.updateCallStatus
];

export function areToolHandlersLoaded(): boolean {
  return [createLead, startCall, updateCallStatus].every((handler) => typeof handler === "function");
}

async function executeWithRetry(callId: string, name: string, fn: () => Promise<any>) {
  let attempts = 0;

  while (attempts < 3) {
    try {
      const result = await fn();

      await queryDb(
        "insert into tool_log(call_id,name) values ($1,$2)",
        [callId, name]
      );

      return result;
    } catch (err) {
      attempts++;

      if (attempts >= 3) {
        await queryDb(
          "insert into dead_letter(call_id,name) values ($1,$2)",
          [callId, name]
        );
        throw err;
      }
    }
  }
}

async function handler(
  callId: string,
  name: string,
  params: any,
  fnOrToken: (() => Promise<any>) | string,
): Promise<ToolExecutionResult> {
  if (!callId) {
    throw new Error("Missing callId");
  }

  if (!allowedTools.includes(name as ToolRegistryName)) {
    throw new Error(`INVALID_TOOL: ${name}`);
  }

  if (typeof fnOrToken === "function") {
    return executeWithRetry(callId, name, fnOrToken);
  }

  const token = fnOrToken ?? process.env.AGENT_INTERNAL_API_TOKEN;
  if (!token) {
    throw new Error("Missing auth token");
  }

  const toolMap: Record<ToolRegistryName, (toolParams: Record<string, unknown>, tokenValue: string) => Promise<unknown>> = {
    createLead,
    startCall,
    updateCallStatus
  };

  const tool = toolMap[name as ToolRegistryName];

  logToolCall(callId, name, params);

  try {
    const toolResponse = await executeWithRetry(callId, name, async () => tool(params, token));

    if (!toolResponse || typeof toolResponse !== "object") {
      throw new Error("EMPTY_TOOL_RESULT");
    }

    const result = toolResponse as Record<string, unknown>;
    logToolResult(callId, name, result);
    return result;
  } catch (error) {
    logToolError(callId, name, error);
    throw error;
  }
}

export async function execute(call: ToolExecutionCall): Promise<ToolExecutionResponse> {
  try {
    const result = await executeTool(call);
    return { status: "ok", data: result };
  } catch (err) {
    return {
      status: "error",
      error: {
        code: "EXEC_FAIL",
        message: err instanceof Error ? err.message : "Execution failed"
      }
    };
  }
}

export async function executeTool(call: ToolExecutionCall): Promise<ToolExecutionResult> {
  return handler(call.callId, call.name, call.params, call.fnOrToken);
}
