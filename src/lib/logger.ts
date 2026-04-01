import { logger } from "../infrastructure/logger";

export function logToolCall(callId: string, name: string, params: unknown): void {
  logger.info("tool_call", {
    timestamp: new Date().toISOString(),
    callId,
    operation: name,
    status: "started",
    payload: params
  });
}

export function logToolResult(callId: string, name: string, result: unknown): void {
  logger.info("tool_result", {
    timestamp: new Date().toISOString(),
    callId,
    operation: name,
    status: "ok",
    result
  });
}

export function logToolError(callId: string, name: string, error: unknown): void {
  logger.error("tool_error", {
    timestamp: new Date().toISOString(),
    callId,
    operation: name,
    status: "error",
    error: error instanceof Error ? error.message : String(error)
  });
}
