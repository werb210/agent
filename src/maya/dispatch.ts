// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
// Tool-call dispatcher used by the /api/maya/message handler.
// Enforces the audience whitelist, injects host-provided context
// (notably application_id for client tools so the applicant can't
// read someone else's data), and serializes the result to JSON for
// OpenAI's tool-result message format.
import { isToolAllowed, type MayaAudience } from "./audience.js";
import { lookupTool } from "./toolRegistry.js";

// AGENT_BLOCK_v328_MAYA_FAILSAFE_v1
export type DispatchContext = {
  audience: MayaAudience;
  applicationId?: string | null;
  sessionId?: string | null;
  phone?: string | null;
  email?: string | null;
};

function injectContext(
  toolName: string,
  modelArgs: Record<string, unknown>,
  ctx: DispatchContext,
): Record<string, unknown> {
  // Client tools that read or act on a specific application MUST
  // use the host-supplied application_id, never one the model
  // hallucinates. We force-override.
  const APP_SCOPED_TOOLS = new Set([
    "application.my_status",
    "docs.checklist",
    "pgi.completion_link",
  ]);
  if (APP_SCOPED_TOOLS.has(toolName) && ctx.applicationId) {
    return { ...modelArgs, application_id: ctx.applicationId };
  }
  // AGENT_BLOCK_v328_MAYA_FAILSAFE_v1 — escalate.to_human gets every identity
  // hint the host knows about so BF-Server (v636) can resolve the contact
  // and route the handoff to the right Messages-tab thread.
  if (toolName === "escalate.to_human") {
    return {
      ...modelArgs,
      session_id: (modelArgs.session_id as string | undefined) ?? ctx.sessionId ?? undefined,
      application_id: (modelArgs.application_id as string | undefined) ?? ctx.applicationId ?? undefined,
      phone: (modelArgs.phone as string | undefined) ?? ctx.phone ?? undefined,
      email: (modelArgs.email as string | undefined) ?? ctx.email ?? undefined,
    };
  }
  return modelArgs;
}

export async function dispatchTool(
  toolName: string,
  rawArgs: string | Record<string, unknown> | undefined,
  ctx: DispatchContext,
): Promise<string> {
  if (!isToolAllowed(ctx.audience, toolName)) {
    return JSON.stringify({
      ok: false,
      error: "tool_not_allowed_for_audience",
      tool: toolName,
      audience: ctx.audience,
    });
  }
  const entry = lookupTool(toolName);
  if (!entry) {
    return JSON.stringify({ ok: false, error: "tool_not_found", tool: toolName });
  }
  let parsed: Record<string, unknown> = {};
  if (typeof rawArgs === "string") {
    try {
      parsed = rawArgs.trim() ? JSON.parse(rawArgs) : {};
    } catch {
      return JSON.stringify({ ok: false, error: "tool_args_invalid_json", tool: toolName });
    }
  } else if (rawArgs && typeof rawArgs === "object") {
    parsed = rawArgs;
  }
  const args = injectContext(toolName, parsed, ctx);
  try {
    const result = await entry.run(args);
    return JSON.stringify(result ?? { ok: true });
  } catch (e: any) {
    return JSON.stringify({
      ok: false,
      error: "tool_exception",
      tool: toolName,
      detail: e?.message ?? "unknown",
    });
  }
}
