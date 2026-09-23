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

// AGENT_RESOLVED_APPLICATION_ID_v431
// find_mine is the only tool that turns an authenticated phone into the client's
// real application id. Nothing carried that forward, so my_status and
// docs.checklist ran against whatever id the model made up and returned ok:false.
// Remembered per session, cleared when the session is not seen for an hour.
const resolvedAppIds = new Map<string, { id: string; at: number }>();
const RESOLVED_TTL_MS = 60 * 60 * 1000;

export function rememberResolvedApplicationId(sessionId: string, id: string): void {
  if (!sessionId || !id) return;
  resolvedAppIds.set(sessionId, { id, at: Date.now() });
}

export function getResolvedApplicationId(sessionId: string): string | null {
  const hit = resolvedAppIds.get(sessionId);
  if (!hit) return null;
  if (Date.now() - hit.at > RESOLVED_TTL_MS) {
    resolvedAppIds.delete(sessionId);
    return null;
  }
  return hit.id;
}

/** Pull the client's application id out of a find_mine result. */
export function applicationIdFromFindMine(result: unknown): string | null {
  const apps = (result as { applications?: Array<{ id?: unknown }> } | null)?.applications;
  if (!Array.isArray(apps) || apps.length === 0) return null;
  const id = apps[0]?.id;
  return typeof id === "string" && id ? id : null;
}

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
  if (APP_SCOPED_TOOLS.has(toolName)) {
    // v431 - prefer the host id, then the one find_mine resolved this session.
    // If we have neither, STRIP the model's id rather than pass a guess: the tool
    // can fall back to the phone, and a wrong id silently returns the wrong
    // application (or ok:false, which is what production was doing).
    const trusted = ctx.applicationId || getResolvedApplicationId(String(ctx.sessionId ?? ""));
    if (trusted) return { ...modelArgs, application_id: trusted };
    const { application_id: _discarded, ...withoutGuess } = modelArgs;
    return withoutGuess;
  }
  // AGENT_MAYA_CLIENT_IDENTITY_v1 - phone-keyed client tools must receive the
  // authenticated phone the host decoded from the client's bearer token.
  // Without this, application.find_mine returned phone_required and Maya told a
  // signed-in client "I can't access your details" even though it had the phone.
  // find_mine bridges phone -> the client's application(s), so my_status/next_step
  // etc. can then follow up with a resolved application_id.
  const PHONE_SCOPED_CLIENT_TOOLS = new Set([
    "application.find_mine",
    "application.my_status",
    "application.next_step",
    "signature.status",
    "application.timeline_estimate",
    "application.resume_link",
  ]);
  if (PHONE_SCOPED_CLIENT_TOOLS.has(toolName)) {
    return {
      ...modelArgs,
      phone: (modelArgs.phone as string | undefined) ?? ctx.phone ?? undefined,
      application_id: (modelArgs.application_id as string | undefined) ?? ctx.applicationId ?? undefined,
      session_id: (modelArgs.session_id as string | undefined) ?? ctx.sessionId ?? undefined,
    };
  }
  // AGENT_BLOCK_v328_MAYA_FAILSAFE_v1 — escalate.to_human gets every identity
  // hint the host knows about so BF-Server (v636) can resolve the contact
  // and route the handoff to the right Messages-tab thread.
  // lender.products: server strips lender identity unless audience === "staff",
  // so the model never receives lender name/address/phone/contracts for visitor/client.
  if (toolName === "lender.products") {
    return { ...modelArgs, audience: ctx.audience };
  }
  if (toolName === "escalate.to_human" || toolName === "book.callback") {
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
  // AGENT_TOOL_TRACE_v412 - a client tool returning empty produced an identical
  // "I am unable to retrieve that" every time, with nothing in any log. One line
  // per call, before and after, naming the identity the tool actually received.
  console.log("[maya.tool.call] " + JSON.stringify({
    tool: toolName,
    audience: ctx.audience,
    hasPhone: Boolean((args as Record<string, unknown>).phone),
    hasApplicationId: Boolean((args as Record<string, unknown>).application_id),
    ctxHasPhone: Boolean(ctx.phone),
    ctxHasApplicationId: Boolean(ctx.applicationId),
    argKeys: Object.keys(args ?? {}),
  }));
  try {
    const result = await entry.run(args);
    // v431 - remember what find_mine resolved so the follow-up tools can use it.
    if (toolName === "application.find_mine") {
      const resolved = applicationIdFromFindMine(result);
      if (resolved) rememberResolvedApplicationId(String(ctx.sessionId ?? ""), resolved);
    }
  console.log("[maya.tool.result] " + JSON.stringify({
    tool: toolName,
    ok: (result as { ok?: unknown })?.ok !== false,
    error: (result as { error?: unknown })?.error ?? null,
    keys: result && typeof result === "object" ? Object.keys(result as object) : [],
  }));
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
