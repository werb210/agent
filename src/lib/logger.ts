export function logToolCall(name: string, payload: unknown): void {
  console.log("TOOL START:", name, payload);
}

export function logToolResult(name: string, result: unknown): void {
  console.log("TOOL SUCCESS:", name, result);
}

export function logToolError(name: string, error: unknown): void {
  console.error("TOOL ERROR:", name, error);
}
