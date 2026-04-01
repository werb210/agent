import { log } from "../logger";

export function logToolCall(callId: string, name: string, params: unknown): void {
  log({
    callId,
    operation: name,
    status: "started",
    payload: params
  });
}

export function logToolResult(callId: string, name: string, result: unknown): void {
  log({
    callId,
    operation: name,
    status: "ok",
    result
  });
}

export function logToolError(callId: string, name: string, error: unknown): void {
  log({
    callId,
    operation: name,
    status: "error",
    error: error instanceof Error ? error.message : String(error)
  });
}
