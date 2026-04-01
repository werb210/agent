import { logger } from "../infrastructure/logger";

export function logToolCall(name: string, payload: unknown): void {
  logger.info("tool_call", {
    timestamp: new Date().toISOString(),
    operation: name,
    success: true,
    payload
  });
}

export function logToolResult(name: string, result: unknown): void {
  logger.info("tool_result", {
    timestamp: new Date().toISOString(),
    operation: name,
    success: true,
    result
  });
}

export function logToolError(name: string, error: unknown): void {
  logger.error("tool_error", {
    timestamp: new Date().toISOString(),
    operation: name,
    success: false,
    error: error instanceof Error ? error.message : String(error)
  });
}
