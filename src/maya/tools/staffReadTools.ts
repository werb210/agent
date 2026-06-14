// MAYA_BATCH_B_STAFF_READS_v1
// Four read-only staff tools. Thin pass-throughs to BF-Server /api/maya/staff/*
// (service-JWT authed by callBFServer). BF-silo data.
import { callBFServer } from "../../integrations/bfServerClient.js";

type Result = { ok: boolean; [k: string]: unknown };
function s(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
function n(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}
async function call(path: string, body: Record<string, unknown>): Promise<Result> {
  try {
    const r = await callBFServer<Result>(path, { method: "POST", body });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "request_failed" };
  }
}

export type LenderProductsArgs = { category?: string; country?: string; amount?: number; session_id?: string };
export async function lenderProducts(args: LenderProductsArgs): Promise<Result> {
  return call("/api/maya/staff/lender-products", { category: s(args?.category), country: s(args?.country), amount: n(args?.amount), session_id: s(args?.session_id) });
}
export const LENDER_PRODUCTS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "lender.products",
    description:
      "Search Boreal's active lender products by category (TERM, LOC, EQUIPMENT, etc.), country, and/or deal amount — returns which lenders offer what, with amount ranges. Read-only. Use when staff ask 'which lenders do equipment financing', 'who lends LOC under $250k in Canada', 'what products fit a $500k term loan'. (Distinct from lender.match_explain, which is per-application.)",
    parameters: { type: "object", properties: { category: { type: "string", description: "Product category short code, e.g. TERM, LOC, EQUIPMENT." }, country: { type: "string", description: "Country filter, e.g. CA or US." }, amount: { type: "number", description: "Deal amount to match against product min/max." }, session_id: { type: "string", description: "Optional session id for correlation." } }, required: [] },
  },
};

export type ContactTimelineArgs = { contact_id: string; silo?: string; limit?: number; session_id?: string };
export async function contactTimeline(args: ContactTimelineArgs): Promise<Result> {
  const contactId = s(args?.contact_id);
  if (!contactId) return { ok: false, error: "contact_id_required" };
  return call("/api/maya/staff/contact-timeline", { contact_id: contactId, silo: s(args?.silo), limit: n(args?.limit), session_id: s(args?.session_id) });
}
export const CONTACT_TIMELINE_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "contact.timeline",
    description:
      "Read-only activity timeline for a contact: recent calls and messages (SMS/email) in reverse-chronological order. Use when staff ask 'what's the history with this contact', 'when did we last talk to them', 'show me recent activity'. Provide the contact_id on the current screen; pass the active silo if known.",
    parameters: { type: "object", properties: { contact_id: { type: "string", description: "The contact to show history for (use the id on the current screen)." }, silo: { type: "string", description: "Active silo (BF/BI/SLF) to scope call activity." }, limit: { type: "number", description: "Max items to return (default 25)." }, session_id: { type: "string", description: "Optional session id for correlation." } }, required: ["contact_id"] },
  },
};

export type CallTriageArgs = { silo?: string; limit?: number; session_id?: string };
export async function callTriage(args: CallTriageArgs): Promise<Result> {
  return call("/api/maya/staff/call-triage", { silo: s(args?.silo), limit: n(args?.limit), session_id: s(args?.session_id) });
}
export const CALL_TRIAGE_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "call.triage",
    description:
      "Read-only list of recent voicemails and missed calls that need follow-up. Use when staff ask 'any voicemails today', 'who do I need to call back', 'what missed calls are outstanding'. Pass the active silo to scope missed calls.",
    parameters: { type: "object", properties: { silo: { type: "string", description: "Active silo (BF/BI/SLF) to scope missed calls." }, limit: { type: "number", description: "Max items per list (default 15)." }, session_id: { type: "string", description: "Optional session id for correlation." } }, required: [] },
  },
};

export type RiskFlagsArgs = { application_id: string; session_id?: string };
export async function applicationRiskFlags(args: RiskFlagsArgs): Promise<Result> {
  const appId = s(args?.application_id);
  if (!appId) return { ok: false, error: "application_id_required" };
  return call("/api/maya/staff/risk-flags", { application_id: appId, session_id: s(args?.session_id) });
}
export const APPLICATION_RISK_FLAGS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.risk_flags",
    description:
      "Read-only risk scan of a deal: outstanding documents, unusually large requests, and stale/at-risk deals. Use when staff ask 'any red flags on this deal', 'what's the risk here', 'is this deal at risk'. Provide application_id (the one on the current screen for 'this deal').",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The application to scan." }, session_id: { type: "string", description: "Optional session id for correlation." } }, required: ["application_id"] },
  },
};
