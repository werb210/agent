export type ToolResult = {
  success: true;
  result: Record<string, unknown>;
};

export function validateOutput(result: unknown): ToolResult {
  if (!result || typeof result !== "object") {
    throw new Error("INVALID_TOOL_RESULT");
  }

  if (!("success" in result) || !("result" in result)) {
    throw new Error("INVALID_TOOL_RESULT");
  }

  const resultCandidate = result as Record<string, unknown>;
  const keys = Object.keys(resultCandidate);

  if (keys.length !== 2 || !keys.includes("success") || !keys.includes("result")) {
    throw new Error("INVALID_TOOL_RESULT");
  }

  if (resultCandidate.success !== true || typeof resultCandidate.result !== "object" || resultCandidate.result === null) {
    throw new Error("INVALID_TOOL_RESULT");
  }

  return resultCandidate as ToolResult;
}
