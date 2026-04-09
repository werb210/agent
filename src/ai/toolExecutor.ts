import { createLead, startCall, updateCallStatus } from "../tools";
import { TOOL_REGISTRY, ToolRegistryName } from "../tools/registry";
import { log } from "../logger";
import { validateToolCall } from "../core/validateTool";
import { executeTool as executeMayaTool } from "../core/toolExecutor";
import { emitter } from "../realtime/emitter";
import { EVENTS } from "../realtime/events";
import jwt from "jsonwebtoken";

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
        code:
          | "UNKNOWN_TOOL"
          | "EXEC_FAIL"
          | "INVALID_TOOL_RESPONSE"
          | "MISSING_TOOL_STATUS"
          | "TOOL_TIMEOUT"
          | "TOOL_NOT_ALLOWED";
        message?: string;
      };
    };

const tools: Record<ToolRegistryName, (context: ToolExecutionContext) => Promise<Record<string, unknown>>> = {
  [TOOL_REGISTRY.createLead]: async ({ input }) => createLead(input, getAgentAuthToken()) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.startCall]: async ({ input }) => startCall(input, getAgentAuthToken()) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.updateCallStatus]: async ({ input }) => updateCallStatus(input, getAgentAuthToken()) as Promise<Record<string, unknown>>
};

const toolNames = Object.keys(tools);
const allowedTools = new Set<string>([
  "createLead",
  "scheduleAppointment",
  "updateCRMRecord",
  TOOL_REGISTRY.startCall,
  TOOL_REGISTRY.updateCallStatus
]);

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

export function withTimeout<T>(promise: Promise<T>, ms = 10_000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("TOOL_TIMEOUT")), ms);
    })
  ]);
}

function getAgentAuthToken(): string {
  const secret = process.env.JWT_SECRET;
  if (secret) {
    return jwt.sign(
      { id: "agent-service", phone: "agent", role: "Staff" },
      secret,
      { expiresIn: "1h" }
    );
  }

  const token = process.env.AGENT_API_TOKEN;
  if (!token) {
    throw new Error("MISSING_AUTH");
  }

  return token;
}

function validateTool(name: string): void {
  if (!allowedTools.has(name)) {
    throw new Error("TOOL_NOT_ALLOWED");
  }
}

async function execTool(fn: () => Promise<Record<string, unknown>>): Promise<Record<string, unknown>> {
  return withTimeout(fn());
}

async function execute(call: ToolExecutionCall): Promise<ToolExecutionResponse> {
  try {
    validateTool(call.tool);

    if (!process.env.JWT_SECRET && !process.env.AGENT_API_TOKEN) {
      throw new Error("AGENT AUTH TOKEN MISSING");
    }

    if (![TOOL_REGISTRY.createLead, TOOL_REGISTRY.startCall, TOOL_REGISTRY.updateCallStatus].includes(call.tool as ToolRegistryName)) {
      const toolCall = validateToolCall({
        name: call.tool,
        arguments: call.input
      });

      try {
        const result = await executeMayaTool(toolCall);
        if (result && typeof result === "object" && "status" in (result as Record<string, unknown>) && (result as Record<string, unknown>).status === "error") {
          throw new Error(String((result as Record<string, unknown>).error || "Execution failed"));
        }
        emitter.emit(EVENTS.TOOL_EXECUTED, { name: toolCall.name });
        log({ callId: call.callId, operation: call.tool, status: "ok" });
        return { status: "ok", data: deepFreeze(result as Record<string, unknown>) };
      } catch (err) {
        console.error("Tool failed", err);
        throw err;
      }
    }

    if (!tools[call.tool as ToolRegistryName]) {
      return {
        status: "error",
        error: {
          code: "UNKNOWN_TOOL",
          message: call.tool
        }
      };
    }

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
    if (err instanceof Error && (err.message === "TOOL_TIMEOUT" || err.message === "TOOL_NOT_ALLOWED")) {
      return {
        status: "error",
        error: { code: err.message, message: call.tool }
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

  const res = await execTool(() => tools[call.tool as ToolRegistryName](context));

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
