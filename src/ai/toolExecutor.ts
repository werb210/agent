import { queryDb } from "../lib/db";
import { logToolCall, logToolError, logToolResult } from "../lib/logger";
import { createLead, startCall, updateCallStatus } from "../tools";
import { TOOL_REGISTRY, ToolRegistryName } from "../tools/registry";

export type ToolExecutionResult = {
  success: true;
  result: Record<string, unknown>;
};

const allowedTools: ToolRegistryName[] = [
  TOOL_REGISTRY.createLead,
  TOOL_REGISTRY.startCall,
  TOOL_REGISTRY.updateCallStatus
];

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

export async function executeTool(
  callId: string,
  name: string,
  params: any,
  fnOrToken: (() => Promise<any>) | string,
): Promise<any> {
  if (typeof fnOrToken === "function") {
    return executeWithRetry(callId, name, fnOrToken);
  }

  const globalState = globalThis as typeof globalThis & { __TOOL_RUNNING__?: boolean };
  if (globalState.__TOOL_RUNNING__) {
    throw new Error("PARALLEL_TOOL_EXECUTION_BLOCKED");
  }

  if (!allowedTools.includes(name as ToolRegistryName)) {
    throw new Error(`INVALID_TOOL: ${name}`);
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

  globalState.__TOOL_RUNNING__ = true;
  logToolCall(name, { callId, params });

  try {
    const toolResponse = await executeWithRetry(callId, name, async () => tool(params, token));

    if (!toolResponse || typeof toolResponse !== "object") {
      throw new Error("EMPTY_TOOL_RESULT");
    }

    const result: ToolExecutionResult = {
      success: true,
      result: toolResponse as Record<string, unknown>
    };

    logToolResult(name, result);
    return result;
  } catch (error) {
    console.error("TOOL_ERROR", name, error);
    logToolError(name, error);
    throw error;
  } finally {
    globalState.__TOOL_RUNNING__ = false;
  }
}
