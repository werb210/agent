import {
  createLead,
  startCall,
  updateCallStatus,
  readApplication,
  listApplications,
  readContact,
  listContacts,
  listLenderProducts,
  listDocumentsForApplication
} from "../tools/index.js";
import { TOOL_REGISTRY, ToolRegistryName } from "../tools/registry.js";
import { log } from "../logger.js";
import { validateToolCall } from "../core/validateTool.js";
import { executeTool as executeMayaTool } from "../core/toolExecutor.js";
import { emitter } from "../realtime/emitter.js";
import { EVENTS } from "../realtime/events.js";
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
  [TOOL_REGISTRY.updateCallStatus]: async ({ input }) => updateCallStatus(input, getAgentAuthToken()) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.readApplication]: async ({ input }) => readApplication(String(input.id ?? "")) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.listApplications]: async ({ input }) => listApplications(typeof input.silo === "string" ? input.silo : undefined) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.readContact]: async ({ input }) => readContact(String(input.id ?? "")) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.listContacts]: async ({ input }) => listContacts(typeof input.silo === "string" ? input.silo : undefined) as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.listLenderProducts]: async () => listLenderProducts() as Promise<Record<string, unknown>>,
  [TOOL_REGISTRY.listDocumentsForApplication]: async ({ input }) => listDocumentsForApplication(String(input.applicationId ?? "")) as Promise<Record<string, unknown>>
};

const toolNames = Object.keys(tools);
const allowedTools = new Set<string>([
  "createLead",
  "scheduleAppointment",
  "updateCRMRecord",
  TOOL_REGISTRY.startCall,
  TOOL_REGISTRY.updateCallStatus,
  TOOL_REGISTRY.readApplication,
  TOOL_REGISTRY.listApplications,
  TOOL_REGISTRY.readContact,
  TOOL_REGISTRY.listContacts,
  TOOL_REGISTRY.listLenderProducts,
  TOOL_REGISTRY.listDocumentsForApplication
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

// AGENT_SERVICE_TOKEN_v1
// Was: a fresh jwt.sign on every tool call, discarding a token with 59 minutes
// of life left. Cache it and re-mint only near expiry.
let cachedToken: { value: string; expiresAtMs: number } | null = null;
const TOKEN_TTL_MS = 60 * 60 * 1000;
const RENEW_BEFORE_MS = 5 * 60 * 1000;

/** Test seam. */
export function __resetAgentAuthToken(): void {
  cachedToken = null;
}

function getAgentAuthToken(now: () => number = Date.now): string {
  const secret = process.env.JWT_SECRET;

  // config/env.ts falls back to the literal "test_secret" when JWT_SECRET is
  // unset. Signing with it produces a token BF-Server rejects, so a missing
  // Azure setting surfaces as unexplained 401s instead of a config error.
  if (secret === "test_secret") {
    throw new Error("JWT_SECRET is the test default; set it to match BF-Server");
  }

  if (secret) {
    const nowMs = now();
    if (cachedToken && nowMs < cachedToken.expiresAtMs - RENEW_BEFORE_MS) {
      return cachedToken.value;
    }
    const value = jwt.sign(
      {
        id: "agent-service",
        phone: "agent",
        role: "Staff",
        // Maya held full Staff authority with nothing marking her apart from a
        // human on the same role. Audit rows could not tell them apart.
        principal: "service",
        service: "maya-agent"
      },
      secret,
      { expiresIn: "1h" }
    );
    cachedToken = { value, expiresAtMs: nowMs + TOKEN_TTL_MS };
    return value;
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

    if (![
      TOOL_REGISTRY.createLead,
      TOOL_REGISTRY.startCall,
      TOOL_REGISTRY.updateCallStatus,
      TOOL_REGISTRY.readApplication,
      TOOL_REGISTRY.listApplications,
      TOOL_REGISTRY.readContact,
      TOOL_REGISTRY.listContacts,
      TOOL_REGISTRY.listLenderProducts,
      TOOL_REGISTRY.listDocumentsForApplication
    ].includes(call.tool as ToolRegistryName)) {
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
