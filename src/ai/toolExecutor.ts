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
  | { status: "ok"; data: Record<string, unknown> }
  | { status: "error"; error: { code: "UNKNOWN_TOOL" | "EXEC_FAIL"; message: string } };

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

  return tools[call.tool as ToolRegistryName](context);
}

export { execute };
