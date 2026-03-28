import { logger } from "../infrastructure/logger";
import { bfServerRequest } from "../integrations/bfServerClient";

export type ToolExecutionResult = {
  success: true;
  result: Record<string, unknown>;
};

type ToolName = "createLead" | "scheduleAppointment" | "sendSMS" | "updateCRM";

const allowedTools: ToolName[] = ["createLead", "scheduleAppointment", "sendSMS", "updateCRM"];

function isCreateLeadPayload(params: Record<string, unknown>): boolean {
  const name = params.name;
  const phone = params.phone;
  const email = params.email;

  if (typeof name !== "string" || name.trim().length === 0) {
    return false;
  }

  if (typeof phone !== "string" || phone.trim().length === 0) {
    return false;
  }

  if (email !== undefined && typeof email !== "string") {
    return false;
  }

  return true;
}

function assertToolResult(result: unknown): asserts result is ToolExecutionResult {
  if (!result || typeof result !== "object") {
    throw new Error("INVALID_TOOL_RESULT");
  }

  if (!("success" in result) || !("result" in result)) {
    throw new Error("INVALID_TOOL_RESULT");
  }

  const resultRecord = result as Record<string, unknown>;
  const keys = Object.keys(resultRecord);
  if (keys.length !== 2 || !keys.includes("success") || !keys.includes("result")) {
    throw new Error("INVALID_TOOL_RESULT");
  }

  if (resultRecord.success !== true || typeof resultRecord.result !== "object" || resultRecord.result === null) {
    throw new Error("INVALID_TOOL_RESULT");
  }

  if (resultRecord.result == null) {
    throw new Error("EMPTY_TOOL_RESULT");
  }
}

export async function executeTool(name: string, params: Record<string, unknown>): Promise<ToolExecutionResult> {
  const globalState = globalThis as typeof globalThis & { __TOOL_RUNNING__?: boolean };
  if (globalState.__TOOL_RUNNING__) {
    throw new Error("PARALLEL_TOOL_EXECUTION_BLOCKED");
  }

  if (!allowedTools.includes(name as ToolName)) {
    throw new Error(`INVALID_TOOL: ${name}`);
  }

  logger.info("tool_call_start", { toolName: name });

  const toolMap: Record<ToolName, (toolParams: Record<string, unknown>) => Promise<unknown>> = {
    createLead: async (toolParams) => {
      if (!isCreateLeadPayload(toolParams)) {
        throw new Error("Invalid createLead payload");
      }

      return bfServerRequest("/api/crm/createLead", "POST", toolParams);
    },
    scheduleAppointment: async (toolParams) => bfServerRequest("/api/applications/create", "POST", toolParams),
    sendSMS: async (toolParams) => bfServerRequest("/api/calls/log", "POST", { type: "sms", ...toolParams }),
    updateCRM: async (toolParams) => bfServerRequest("/api/crm/contacts", "POST", toolParams)
  };

  const tool = toolMap[name as ToolName];
  if (!tool) {
    throw new Error("UNKNOWN_TOOL");
  }

  globalState.__TOOL_RUNNING__ = true;
  try {
    const toolResponse = await tool(params);
    if (!toolResponse || typeof toolResponse !== "object") {
      throw new Error("EMPTY_TOOL_RESULT");
    }

    const result: ToolExecutionResult = {
      success: true,
      result: toolResponse as Record<string, unknown>
    };
    assertToolResult(result);

    logger.info("tool_call_success", { toolName: name });
    logger.info("tool_call_end", { toolName: name, outcome: "success" });
    return result;
  } finally {
    globalState.__TOOL_RUNNING__ = false;
  }
}
