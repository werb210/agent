import { createLead, startCall, updateCallStatus } from "../tools";
import { TOOL_REGISTRY, ToolRegistryName } from "../tools/registry";
import { log } from "../logger";

export type ToolExecutionCall = {
  callId: string;
  tool: ToolRegistryName | string;
  input: Record<string, unknown>;
};

type ToolExecutionContext = Readonly<{
  callId: string;
  input: Record<string, unknown>;
}>;

export type ToolExecutionResponse =
  | { status: "ok"; data: Record<string, unknown>; error?: undefined }
  | {
      status: "error";
      data?: undefined;
      error: {
        code: "UNKNOWN_TOOL" | "EXEC_FAIL" | "INVALID_TOOL_RESPONSE" | "MISSING_TOOL_STATUS";
        message?: string;
      };
    };

const tools: Record<ToolRegistryName, (context: ToolExecutionContext) => Promise<Record<string, unknown>>> = {
  [TOOL_REGISTRY.createLead]: async ({ input }) => createLead(input, String(input.token ?? "")) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.startCall]: async ({ input }) => startCall(input, String(input.token ?? "")) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.updateCallStatus]: async ({ input }) => updateCallStatus(input, String(input.token ?? "")) as Promise<Record<string, unknown>>
};

const toolNames = Object.keys(tools);

if (toolNames.length === 0) {
  throw new Error("NO_TOOLS_REGISTERED");
}

for (const name of toolNames) {
  if (typeof tools[name as ToolRegistryName] !== "function") {
    throw new Error(`INVALID_TOOL_HANDLER_${name}`);
  }
}

export function areToolHandlersLoaded(): boolean {
  return toolNames.every((name) => typeof tools[name as ToolRegistryName] === "function");
}

async function execute(call: ToolExecutionCall): Promise<ToolExecutionResponse> {
  if (!tools[call.tool as ToolRegistryName]) {
    return {
      status: "error",
      error: {
        code: "UNKNOWN_TOOL",
        message: call.tool
      }
    };
  }

  try {
    const result = await executeTool(call);
    log({ callId: call.callId, operation: call.tool, status: "ok" });
    return { status: "ok", data: result };
  } catch (err) {
    log({ callId: call.callId, operation: call.tool, status: "error" });
    if (err instanceof Error && (err.message === "INVALID_TOOL_RESPONSE" || err.message === "MISSING_TOOL_STATUS")) {
      return {
        status: "error",
        error: { code: err.message }
      };
    }
    return {
      status: "error",
      error: {
        code: "EXEC_FAIL",
        message: err instanceof Error ? err.message : "Execution failed"
      }
    };
  }
}

function deepFreeze<T>(obj: T): T {
  if (obj && typeof obj === "object") {
    Object.freeze(obj);
    Object.values(obj as Record<string, unknown>).forEach((value) => {
      deepFreeze(value);
    });
  }

  return obj;
}

async function executeTool(call: ToolExecutionCall): Promise<Record<string, unknown>> {
  const context = deepFreeze({
    callId: call.callId,
    input: call.input
  });

  const res = await tools[call.tool as ToolRegistryName](context);

  if (!res || typeof res !== "object") {
    throw new Error("INVALID_TOOL_RESPONSE");
  }

  if ("status" in res && !(res as Record<string, unknown>).status) {
    throw new Error("MISSING_TOOL_STATUS");
  }

  const frozen = deepFreeze(res);
  return frozen;
}

export { execute };
