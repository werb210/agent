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

export type LenderProductsArgs = { category?: string; country?: string; amount?: number; session_id?: string; audience?: string };
export async function lenderProducts(args: LenderProductsArgs): Promise<Result> {
  return call("/api/maya/staff/lender-products", { category: s(args?.category), country: s(args?.country), amount: n(args?.amount), session_id: s(args?.session_id), audience: s(args?.audience) });
}
export const LENDER_PRODUCTS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "lender.products",
    description:
      "Look up Boreal's active lender products by category (TERM, LOC, EQUIPMENT, etc.), country, and/or deal amount. Returns which lenders offer what, with amount ranges AND interest-rate ranges (interestMin/interestMax). Read-only and safe for any audience — contains no client-specific data. Use it to answer ANY product or pricing question, e.g. 'what's the interest rate on a term loan', 'do you do equipment financing', 'what LOC options are there in Canada'. When asked about rates, summarize as a RANGE across matching products (e.g. 'our term loans generally run between X% and Y%') and add that the actual rate depends on factors like credit, time in business, revenue, and the specific lender — never quote a single guaranteed rate.",
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

// AGENT_MAYA_CRM_TOOLS_v1 - CRM read+act tools (wrap BF-Server /staff/crm-*).
export type CrmNotesArgs = { contact_id: string; session_id?: string };
export async function crmNotes(args: CrmNotesArgs): Promise<Result> {
  const contactId = s(args?.contact_id);
  if (!contactId) return { ok: false, error: "contact_id_required" };
  return call("/api/maya/staff/crm-notes", { contact_id: contactId, session_id: s(args?.session_id) });
}
export const CRM_NOTES_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "crm.notes",
    description: "Read the notes logged on a CRM contact (most recent first). Use when staff ask 'what notes are on this contact', 'what's been logged'. Provide the contact_id on the current screen.",
    parameters: { type: "object", properties: { contact_id: { type: "string", description: "The contact whose notes to read." }, session_id: { type: "string", description: "Optional session id." } }, required: ["contact_id"] },
  },
};

export type CrmAddNoteArgs = { contact_id: string; body: string; silo?: string; session_id?: string };
export async function crmAddNote(args: CrmAddNoteArgs): Promise<Result> {
  const contactId = s(args?.contact_id);
  const body = s(args?.body);
  if (!contactId || !body) return { ok: false, error: "contact_id_and_body_required" };
  return call("/api/maya/staff/crm-add-note", { contact_id: contactId, body, silo: s(args?.silo), session_id: s(args?.session_id) });
}
export const CRM_ADD_NOTE_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "crm.add_note",
    description: "Add a note to a CRM contact. Use when staff say 'log a note', 'note that ...', 'add to this contact'. Provide the contact_id on the current screen and the note body.",
    parameters: { type: "object", properties: { contact_id: { type: "string", description: "The contact to add the note to." }, body: { type: "string", description: "The note text." }, silo: { type: "string", description: "Active silo (BF/BI/SLF)." }, session_id: { type: "string" } }, required: ["contact_id", "body"] },
  },
};

export type CrmTasksArgs = { contact_id: string; session_id?: string };
export async function crmTasks(args: CrmTasksArgs): Promise<Result> {
  const contactId = s(args?.contact_id);
  if (!contactId) return { ok: false, error: "contact_id_required" };
  return call("/api/maya/staff/crm-tasks", { contact_id: contactId, session_id: s(args?.session_id) });
}
export const CRM_TASKS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "crm.tasks",
    description: "Read the tasks on a CRM contact (by due date). Use when staff ask 'what tasks are open for this contact', 'what's due'. Provide the contact_id on the current screen.",
    parameters: { type: "object", properties: { contact_id: { type: "string", description: "The contact whose tasks to read." }, session_id: { type: "string" } }, required: ["contact_id"] },
  },
};

export type CrmCreateTaskArgs = { contact_id: string; title: string; due_at?: string; priority?: string; notes?: string; silo?: string; session_id?: string };
export async function crmCreateTask(args: CrmCreateTaskArgs): Promise<Result> {
  const contactId = s(args?.contact_id);
  const title = s(args?.title);
  if (!contactId || !title) return { ok: false, error: "contact_id_and_title_required" };
  return call("/api/maya/staff/crm-create-task", { contact_id: contactId, title, due_at: s(args?.due_at), priority: s(args?.priority), notes: s(args?.notes), silo: s(args?.silo), session_id: s(args?.session_id) });
}
export const CRM_CREATE_TASK_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "crm.create_task",
    description: "Create a task on a CRM contact. Use when staff say 'create a task', 'remind me to ...', 'follow up with this contact'. Provide the contact_id on the current screen and a title; optionally due_at (ISO date) and priority (high/medium/low/none).",
    parameters: { type: "object", properties: { contact_id: { type: "string", description: "The contact to create the task for." }, title: { type: "string", description: "Task title." }, due_at: { type: "string", description: "Optional ISO due date." }, priority: { type: "string", description: "high | medium | low | none." }, notes: { type: "string", description: "Optional task notes." }, silo: { type: "string" }, session_id: { type: "string" } }, required: ["contact_id", "title"] },
  },
};
