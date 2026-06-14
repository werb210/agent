// MAYA_BATCH_B2_STAFF_READS_v1
// Five read-only staff tools (banking summary, credit-summary readout, contact
// notes, missing-doc request DRAFT, daily briefing). Pass-throughs to BF-Server
// /api/maya/staff/* (service-JWT via callBFServer). BF silo. None mutate state;
// docs.request_draft only drafts a message — it never sends.
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

export type BankingSummaryArgs = { application_id: string; session_id?: string };
export async function bankingSummary(args: BankingSummaryArgs): Promise<Result> {
  const appId = s(args?.application_id);
  if (!appId) return { ok: false, error: "application_id_required" };
  return call("/api/maya/staff/banking-summary", { application_id: appId, session_id: s(args?.session_id) });
}
export const BANKING_SUMMARY_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "banking.summary",
    description:
      "Read-only banking-analysis summary of a deal: average monthly deposits, average daily balance, NSFs, months profitable, and the statement period. Use when staff ask 'how do the bank statements look', 'what's the cash flow', 'any NSFs on this deal'. Provide application_id (the one on the current screen for 'this deal').",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The application to summarize." }, session_id: { type: "string", description: "Optional session id." } }, required: ["application_id"] },
  },
};

export type CreditSummaryArgs = { application_id: string; session_id?: string };
export async function creditSummary(args: CreditSummaryArgs): Promise<Result> {
  const appId = s(args?.application_id);
  if (!appId) return { ok: false, error: "application_id_required" };
  return call("/api/maya/staff/credit-summary", { application_id: appId, session_id: s(args?.session_id) });
}
export const CREDIT_SUMMARY_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "credit.summary",
    description:
      "Read the existing credit summary for a deal (status, version, and section narratives like Overview, Financial Summary, Risks & Mitigants, Rationale). Read-only — does NOT generate or edit one. Use when staff ask 'what's the credit summary say', 'show me the write-up', 'what's the rationale on this deal'. Provide application_id.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The application to read the credit summary for." }, session_id: { type: "string", description: "Optional session id." } }, required: ["application_id"] },
  },
};

export type NotesReadArgs = { contact_id?: string; company_id?: string; silo?: string; limit?: number; session_id?: string };
export async function notesRead(args: NotesReadArgs): Promise<Result> {
  const contactId = s(args?.contact_id);
  const companyId = s(args?.company_id);
  if (!contactId && !companyId) return { ok: false, error: "contact_id_or_company_id_required" };
  return call("/api/maya/staff/notes-read", { contact_id: contactId, company_id: companyId, silo: s(args?.silo), limit: n(args?.limit), session_id: s(args?.session_id) });
}
export const NOTES_READ_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "notes.read",
    description:
      "Read-only recent CRM notes for a contact or company, most recent first. Use when staff ask 'what are the latest notes', 'what's been logged on this contact', 'any notes on this account'. Provide the contact_id (or company_id) on the current screen; pass the active silo if known. Does NOT add or edit notes.",
    parameters: { type: "object", properties: { contact_id: { type: "string", description: "Contact to read notes for." }, company_id: { type: "string", description: "Company to read notes for (alternative to contact_id)." }, silo: { type: "string", description: "Active silo (BF/BI/SLF)." }, limit: { type: "number", description: "Max notes (default 20)." }, session_id: { type: "string", description: "Optional session id." } }, required: [] },
  },
};

export type DocsRequestDraftArgs = { application_id: string; session_id?: string };
export async function docsRequestDraft(args: DocsRequestDraftArgs): Promise<Result> {
  const appId = s(args?.application_id);
  if (!appId) return { ok: false, error: "application_id_required" };
  return call("/api/maya/staff/docs-request-draft", { application_id: appId, session_id: s(args?.session_id) });
}
export const DOCS_REQUEST_DRAFT_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "docs.request_draft",
    description:
      "Draft a friendly message asking the applicant for the documents still outstanding on a deal. Returns the draft text and the missing-document list. Read-only — it DRAFTS only and never sends; staff send it themselves. Use when staff say 'draft a request for the missing docs', 'what should I ask them for'. Provide application_id.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The application to draft a doc request for." }, session_id: { type: "string", description: "Optional session id." } }, required: ["application_id"] },
  },
};

export type DailyBriefingArgs = { silo?: string; session_id?: string };
export async function dailyBriefing(args: DailyBriefingArgs): Promise<Result> {
  return call("/api/maya/staff/daily-briefing", { silo: s(args?.silo), session_id: s(args?.session_id) });
}
export const DAILY_BRIEFING_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "daily.briefing",
    description:
      "Read-only 'what needs my attention' briefing for the staff member's silo: deals waiting on documents, stale deals with no recent activity, and recent voicemails/missed calls. Use when staff ask 'what needs my attention today', 'give me a briefing', 'what's on my plate'. Pass the active silo.",
    parameters: { type: "object", properties: { silo: { type: "string", description: "Active silo (BF/BI/SLF); defaults to BF." }, session_id: { type: "string", description: "Optional session id." } }, required: [] },
  },
};
