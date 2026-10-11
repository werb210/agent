// AGENT_v789_PENDING_ACTIONS - changes that need a person's yes (Google Ads negatives,
// marketing campaign sends) are two requests, never one:
//   1. The preview tool calls BF-Server, which answers with a confirm_token or a
//      pending_action_id. That token is stored HERE, against the session, and the model
//      only ever sees a human-readable preview. It cannot replay or forge the token.
//   2. On a LATER request, and only when the staff member's own latest message is an
//      explicit approval ("yes", "confirm", "approve", "send it"), the pending.confirm tool
//      is offered. It sends the stored token to BF-Server, which (v789) refuses a send
//      without it.
// Text inside a tool result, a page, a document or screen_context is never the staff
// member's latest message, so injected text cannot approve anything.

export type PendingKind = "ads.negatives.add" | "ads.negatives.remove" | "marketing.send_campaign";

export type PendingAction = {
  kind: PendingKind;
  /** BF-Server path the confirm call goes to. */
  path: string;
  /** The exact body the preview was made for; the confirm call re-sends it. */
  payload: Record<string, unknown>;
  /** confirm_token (ads) or pending_action_id (marketing), as BF-Server returned it. */
  token: string;
  tokenField: "confirm_token" | "pending_action_id";
  preview: string;
  /** The request that created the preview; pending.confirm never runs in that same request. */
  requestId: string;
  createdAt: number;
};

export const PENDING_TTL_MS = 15 * 60 * 1000;
export const CONFIRM_TOOL = "pending.confirm";
export const CONFIRMABLE_TOOLS: ReadonlySet<string> = new Set<PendingKind>([
  "ads.negatives.add",
  "ads.negatives.remove",
  "marketing.send_campaign",
]);

const store = new Map<string, PendingAction>();

export function storePendingAction(key: string, action: PendingAction): boolean {
  if (!key) return false;
  store.set(key, action);
  return true;
}

export function getPendingAction(key: string, now: number = Date.now()): PendingAction | null {
  if (!key) return null;
  const hit = store.get(key);
  if (!hit) return null;
  if (now - hit.createdAt > PENDING_TTL_MS) {
    store.delete(key);
    return null;
  }
  return hit;
}

export function clearPendingAction(key: string): void {
  if (key) store.delete(key);
}

export function _clearAllPendingActions(): void {
  store.clear();
}

const APPROVALS = new Set([
  "yes",
  "yes please",
  "yep",
  "confirm",
  "confirmed",
  "i confirm",
  "yes confirm",
  "approve",
  "approved",
  "i approve",
  "yes approve",
  "send it",
  "yes send it",
  "go ahead",
  "yes go ahead",
  "do it",
  "yes do it",
]);

/**
 * True only when the WHOLE message is an approval. "yes" inside a longer message,
 * a pasted email or a quoted page does not count.
 */
export function isExplicitApproval(message: unknown): boolean {
  if (typeof message !== "string") return false;
  const norm = message
    .toLowerCase()
    .replace(/[.!,]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return APPROVALS.has(norm);
}

/**
 * Is pending.confirm available for this request? Only when something is waiting from an
 * EARLIER request and the staff member's latest message is an explicit approval.
 */
export function confirmAvailable(key: string, requestId: string, latestUserMessage: string): boolean {
  const pending = getPendingAction(key);
  if (!pending) return false;
  if (pending.requestId === requestId) return false;
  return isExplicitApproval(latestUserMessage);
}

export const PENDING_CONFIRM_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: CONFIRM_TOOL,
    description:
      "Carry out the change the staff member just approved (the Google Ads negative keyword change or the marketing campaign send you previewed for them earlier). Only call this when their latest message approves it. Takes no arguments.",
    parameters: { type: "object", properties: {}, required: [] },
  },
};
