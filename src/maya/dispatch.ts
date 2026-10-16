// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
// Tool-call dispatcher used by the /api/maya/message handler.
// Enforces the audience whitelist, injects host-provided context
// (notably application_id for client tools so the applicant can't
// read someone else's data), and serializes the result to JSON for
// OpenAI's tool-result message format.
import { isToolAllowed, type MayaAudience } from "./audience.js";
import { lookupTool } from "./toolRegistry.js";

import { sessionKey } from "./sessionKey.js";
import { runInStaffScope } from "../lib/staffScope.js";
import { callBFServer } from "../integrations/bfServerClient.js";
import {
  CONFIRM_TOOL, confirmAvailable, getPendingAction, clearPendingAction, storePendingAction,
} from "./pendingActions.js";
import { claimHandoff, finishHandoff, getProvidedContact, rememberProvidedContact } from "./handoff.js";

// AGENT_BLOCK_v328_MAYA_FAILSAFE_v1
export type DispatchContext = {
  audience: MayaAudience;
  /** Client only: the application_id that came in the request (BF-Server v789 strips ids the client does not own). */
  applicationId?: string | null;
  sessionId?: string | null;
  /** AGENT_v789_SESSION_KEY - the verified subject from X-Maya-Context (staff id, client phone, visitor sub). */
  subject?: string | null;
  /** The verified phone from X-Maya-Context (client only). */
  phone?: string | null;
  /** A verified email, if the context carries one. Never one the model typed. */
  email?: string | null;
  /** AGENT_v789_HANDOFF_IDENTITY - the client's CRM contact id from X-Maya-Context. */
  contactId?: string | null;
  /** AGENT_MAYA_INSIGHTS_v657 - the signed-in staff member (portal), never the viewed contact. */
  staffEmail?: string | null;
  /** AGENT_v789_PENDING_ACTIONS - the staff member's own phone, for test sends to themselves. */
  staffPhone?: string | null;
  /** AGENT_MAYA_FACTS_v371 - the signed-in staff member's role and the portal's silo, set by the host. */
  staffRole?: string | null;
  /** AGENT_v784_MAYA_CONTEXT - the signed-in staff member's id from the verified context token. */
  staffId?: string | null;
  silo?: string | null;
  /** AGENT_v789_PENDING_ACTIONS - the id of this /api/maya/message request. */
  requestId?: string | null;
  /** AGENT_v789_PENDING_ACTIONS - the staff member's own latest message, the only thing that can approve. */
  latestUserMessage?: string | null;
  /** AGENT_v789_HANDOFF_IDENTITY - handoff limit key when there is no session id (audience|subject|ip). */
  rateKey?: string | null;
};

function keyOf(ctx: DispatchContext): string {
  return sessionKey(ctx.audience, ctx.subject ?? null, ctx.sessionId ?? null);
}

// AGENT_RESOLVED_APPLICATION_ID_v431
// find_mine is the only tool that turns an authenticated phone into the client's
// real application id. Nothing carried that forward, so my_status and
// docs.checklist ran against whatever id the model made up and returned ok:false.
// Remembered per session, cleared when the session is not seen for an hour.
// AGENT_v789_SESSION_KEY - keyed by sessionKey(audience, subject, sessionId), never a bare session id.
const resolvedAppIds = new Map<string, { id: string; at: number }>();
const RESOLVED_TTL_MS = 60 * 60 * 1000;

export function rememberResolvedApplicationId(key: string, id: string): void {
  if (!key || !id) return;
  resolvedAppIds.set(key, { id, at: Date.now() });
}

export function getResolvedApplicationId(key: string): string | null {
  if (!key) return null;
  const hit = resolvedAppIds.get(key);
  if (!hit) return null;
  if (Date.now() - hit.at > RESOLVED_TTL_MS) {
    resolvedAppIds.delete(key);
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

// AGENT_v789_IDENTITY - argument names that carry identity or authority. In the client and
// public audiences the model may never set an application, contact or phone; in every
// audience it may never set who the staff member is, their role or silo, or a confirmation.
const IDENTITY_KEYS = ["application_id", "applicationId", "contact_id", "contactId", "phone", "phone_number", "session_id", "sessionId", "email", "provided_contact"];
const AUTHORITY_KEYS = ["silo", "role", "audience", "staff_user_id", "staff_email", "staff_phone", "user_email", "approved", "confirm", "confirm_token", "pending_action_id"];
// The visitor's OWN contact details, recorded as an unverified lead. Never used to look anyone up.
const CONTACT_CAPTURE_TOOLS = new Set(["visitor.identify", "lead.capture", "waitlist.join"]);
// Client tools that read one application: they get the request's application id (or the one
// find_mine resolved for this verified client), never one from the model.
const CLIENT_APP_TOOLS = new Set([
  "application.checklist", // MAYA_v817 - gets the request's / resolved application id and the verified phone (BF-Server checks ownership)
  "application.my_status",
  "docs.checklist",
  "pgi.completion_link",
  "docs.rejections",
  "offer.explain",
  "application.next_step",
  "signature.status",
  "application.timeline_estimate",
  "application.resume_link",
]);
const HANDOFF_TOOLS = new Set(["escalate.to_human", "book.callback"]);

function omit(args: Record<string, unknown>, keys: readonly string[]): Record<string, unknown> {
  const out: Record<string, unknown> = { ...args };
  for (const k of keys) delete out[k];
  return out;
}

const present = (v: unknown): v is string => typeof v === "string" && v.trim() !== "";

function trustedApplicationId(ctx: DispatchContext): string | undefined {
  if (ctx.audience !== "client") return undefined;
  if (present(ctx.applicationId)) return ctx.applicationId;
  return getResolvedApplicationId(keyOf(ctx)) ?? undefined;
}

export function injectContext(
  toolName: string,
  modelArgs: Record<string, unknown>,
  ctx: DispatchContext,
): Record<string, unknown> {
  const sessionId = present(ctx.sessionId) ? ctx.sessionId : undefined;

  if (ctx.audience === "staff") {
    // AGENT_v789_STAFF_SCOPE - silo and role always from the verified context (callBFServer
    // stamps them onto the request body too, see src/lib/staffScope.ts).
    const args: Record<string, unknown> = {
      ...omit(modelArgs, AUTHORITY_KEYS),
      silo: ctx.silo || "BF",
      role: ctx.staffRole ?? undefined,
      ...(sessionId ? { session_id: sessionId } : {}),
    };
    if (toolName === "comm.send_sms") args.staff_user_id = ctx.staffId ?? undefined; // AGENT_v784_SMS_DRAFT_ONLY
    if (toolName === "comms.overview") args.user_email = ctx.staffEmail ?? undefined; // AGENT_MAYA_INSIGHTS_v657
    if (toolName === "marketing.send_campaign") {
      args.staff_email = ctx.staffEmail ?? undefined;
      args.staff_phone = ctx.staffPhone ?? undefined;
    }
    if (toolName === "lender.products") args.audience = ctx.audience;
    return args;
  }

  // AGENT_v789_IDENTITY - client and public audiences.
  const keepPhone = CONTACT_CAPTURE_TOOLS.has(toolName);
  const stripped = omit(modelArgs, [...AUTHORITY_KEYS, ...IDENTITY_KEYS.filter((k) => !(keepPhone && (k === "phone" || k === "email")))]);
  const args: Record<string, unknown> = { ...stripped, ...(sessionId ? { session_id: sessionId } : {}) };
  const verifiedPhone = ctx.audience === "client" && present(ctx.phone) ? ctx.phone : undefined;

  if (CLIENT_APP_TOOLS.has(toolName) || toolName === "application.find_mine") {
    const appId = trustedApplicationId(ctx);
    if (appId) args.application_id = appId;
    if (verifiedPhone) args.phone = verifiedPhone;
    return args;
  }
  if (HANDOFF_TOOLS.has(toolName)) {
    // AGENT_v789_HANDOFF_IDENTITY - phone, contact and application only from the verified context.
    const provided = getProvidedContact(keyOf(ctx) || ctx.rateKey || "");
    return {
      ...args,
      phone: verifiedPhone,
      email: present(ctx.email) ? ctx.email : undefined,
      application_id: trustedApplicationId(ctx),
      contact_id: ctx.audience === "client" && present(ctx.contactId) ? ctx.contactId : undefined,
      provided_contact: provided.name || provided.phone || provided.email ? provided : null,
    };
  }
  if (toolName === "lender.products") {
    // lender.products: server strips lender identity unless audience === "staff".
    return { ...args, audience: ctx.audience };
  }
  return args;
}

type ToolResult = Record<string, unknown> & { __pending?: { kind: string; path: string; payload: Record<string, unknown>; token: string | null; tokenField: "confirm_token" | "pending_action_id"; preview: string } };

/** Tokens BF-Server hands back are for the agent, never for the model. */
function scrub(result: unknown): unknown {
  if (!result || typeof result !== "object" || Array.isArray(result)) return result;
  const { confirm_token: _t, pending_action_id: _p, __pending: _d, ...rest } = result as Record<string, unknown>;
  return rest;
}

async function runConfirm(ctx: DispatchContext): Promise<unknown> {
  const key = keyOf(ctx);
  if (ctx.audience !== "staff" || !confirmAvailable(key, String(ctx.requestId ?? ""), String(ctx.latestUserMessage ?? ""))) {
    return { ok: false, error: "nothing_approved", summary: "There is no previewed change waiting for this approval. Preview it first, then ask the staff member to reply yes." };
  }
  const pending = getPendingAction(key)!;
  clearPendingAction(key);
  try {
    const r = await callBFServer<Record<string, unknown>>(pending.path, {
      method: "POST",
      body: { ...pending.payload, confirm: true, [pending.tokenField]: pending.token },
    });
    const ok = !(r && typeof r === "object" && r.ok === false);
    return { ...(scrub(r) as Record<string, unknown> | undefined), ok, action: pending.kind, summary: ok ? `Done: ${pending.preview}` : "BF-Server refused the change." };
  } catch {
    return { ok: false, error: "confirm_failed", action: pending.kind };
  }
}

function handlePreview(result: ToolResult, ctx: DispatchContext): unknown {
  const draft = result.__pending!;
  if (!draft.token) {
    return { ok: false, error: "preview_missing_token", summary: "BF-Server did not return a confirmation for this change, so it cannot go ahead." };
  }
  const stored = storePendingAction(keyOf(ctx), {
    kind: draft.kind as never,
    path: draft.path,
    payload: draft.payload,
    token: draft.token,
    tokenField: draft.tokenField,
    preview: draft.preview,
    requestId: String(ctx.requestId ?? ""),
    createdAt: Date.now(),
  });
  if (!stored) return { ok: false, error: "session_required", summary: "This change needs a chat session so it can be confirmed; nothing was changed." };
  return {
    ok: true,
    awaiting_approval: true,
    preview: draft.preview,
    next: "Show this preview to the staff member and ask them to reply yes to go ahead. Nothing has changed yet.",
  };
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

  // AGENT_v789_HANDOFF_IDENTITY - one handoff per session per 10 minutes.
  const handoffKey = HANDOFF_TOOLS.has(toolName) ? (keyOf(ctx) || ctx.rateKey || "") : "";
  if (HANDOFF_TOOLS.has(toolName)) {
    const claim = claimHandoff(handoffKey);
    if (!claim.allowed) {
      return JSON.stringify(claim.previousOk
        ? { ok: true, already_notified: true, summary: "The team was already notified a few minutes ago; someone will follow up." }
        : { ok: false, error: "handoff_recently_attempted", summary: "A handoff was just attempted. Please wait a few minutes before trying again." });
    }
  }

  const run = (): Promise<unknown> => (toolName === CONFIRM_TOOL ? runConfirm(ctx) : entry.run(args));
  try {
    const result = ctx.audience === "staff"
      ? await runInStaffScope({ silo: ctx.silo || "BF", role: ctx.staffRole ?? null }, run)
      : await run();
    if (HANDOFF_TOOLS.has(toolName)) finishHandoff(handoffKey, (result as { ok?: unknown })?.ok === true);
    // v431 - remember what find_mine resolved so the follow-up tools can use it.
    if (toolName === "application.find_mine" && ctx.audience === "client") {
      const resolved = applicationIdFromFindMine(result);
      if (resolved) rememberResolvedApplicationId(keyOf(ctx), resolved);
    }
    // AGENT_v789_HANDOFF_IDENTITY - what a visitor told us about themselves, for a later handoff.
    if (CONTACT_CAPTURE_TOOLS.has(toolName) && (result as { ok?: unknown })?.ok === true) {
      rememberProvidedContact(keyOf(ctx) || ctx.rateKey || "", { name: args.name as string, phone: args.phone as string, email: args.email as string });
    }
    console.log("[maya.tool.result] " + JSON.stringify({
      tool: toolName,
      ok: (result as { ok?: unknown })?.ok !== false,
      error: (result as { error?: unknown })?.error ?? null,
      keys: result && typeof result === "object" ? Object.keys(result as object) : [],
    }));
    // AGENT_v789_PENDING_ACTIONS - a preview keeps its token here and shows the model only text.
    if (result && typeof result === "object" && (result as ToolResult).__pending) {
      return JSON.stringify(handlePreview(result as ToolResult, ctx));
    }
    return JSON.stringify(scrub(result) ?? { ok: true });
  } catch (e: any) {
    if (HANDOFF_TOOLS.has(toolName)) finishHandoff(handoffKey, false);
    return JSON.stringify({
      ok: false,
      error: "tool_exception",
      tool: toolName,
      detail: e?.message ?? "unknown",
    });
  }
}
