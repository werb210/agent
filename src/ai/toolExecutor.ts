import { logger } from "../infrastructure/logger";
import { bfServerRequest } from "../integrations/bfServerClient";

export type ToolExecutionResult = {
  success: boolean;
  data?: unknown;
  error?: string;
};

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
  if (typeof result !== "object" || result === null) {
    throw new Error("Tool must return object");
  }

  if (typeof (result as ToolExecutionResult).success !== "boolean") {
    throw new Error("Tool must return boolean success");
  }

  if ((result as ToolExecutionResult).success !== true) {
    throw new Error((result as ToolExecutionResult).error || "Tool execution failed");
  }
}

export async function executeTool(name: string, params: Record<string, unknown>): Promise<ToolExecutionResult> {
  logger.info("tool_call_start", { toolName: name });

  let data: unknown;

  switch (name) {
    case "createLead": {
      if (!isCreateLeadPayload(params)) {
        throw new Error("Invalid createLead payload");
      }
      data = await bfServerRequest("/api/crm/createLead", "POST", params);
      break;
    }
    case "scheduleAppointment":
      data = await bfServerRequest("/api/applications/create", "POST", params);
      break;
    case "updateCRMRecord":
      data = await bfServerRequest("/api/crm/contacts", "POST", params);
      break;
    case "sendSMS":
      data = await bfServerRequest("/api/calls/log", "POST", { type: "sms", ...params });
      break;
    case "transferCall":
      data = await bfServerRequest("/api/calls/log", "POST", { type: "transfer", ...params });
      break;
    default:
      throw new Error(`Unsupported tool: ${name}`);
  }

  const result: ToolExecutionResult = { success: true, data };
  assertToolResult(result);

  logger.info("tool_call_success", { toolName: name });
  logger.info("tool_call_end", { toolName: name, outcome: "success" });
  return result;
}
