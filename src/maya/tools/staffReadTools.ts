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
// AGENT_BLOCK_v474_MAYA_QUOTE_FROM_RANGES - BF-Server v473 returns full-catalogue ranges.
export const LENDER_PRODUCTS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "lender.products",
    description:
      "Look up Boreal's active lender products by category (TERM, LOC, EQUIPMENT, etc.), country, and/or deal amount. Returns which lenders offer what, with amount ranges AND interest-rate ranges (interestMin/interestMax). Read-only and safe for any audience — contains no client-specific data. Use it to answer ANY product or pricing question, e.g. 'what's the interest rate on a term loan', 'do you do equipment financing', 'what LOC options are there in Canada'. The response has `ranges` (min/max amount and rate per category and rate kind, computed over EVERY matching product) and `products` (a sample of at most 50). ALWAYS quote funding limits, amounts and rates from `ranges`, never from `products`, and never mix APR, monthly and factor rates. When asked about rates, summarize as a RANGE from `ranges` (e.g. 'our term loans generally run between X% and Y%') and add that the actual rate depends on factors like credit, time in business, revenue, and the specific lender — never quote a single guaranteed rate.",
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

// AGENT_MAYA_MKT_TOOLS_v1 - marketing read + gated send (wrap BF-Server /staff/marketing-*).
export type MarketingOverviewArgs = { silo?: string; session_id?: string };
export async function marketingOverview(args: MarketingOverviewArgs): Promise<Result> {
  return call("/api/maya/staff/marketing-overview", { silo: s(args?.silo), session_id: s(args?.session_id) });
}
export const MARKETING_OVERVIEW_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "marketing.overview",
    description: "Read marketing audience sizes and recent campaign sends: email + SMS opt-in totals, the available segments (contact tags) with recipient counts, and the last few send jobs. Use this before proposing a campaign so you know how many people a segment reaches. Pass the active silo if known.",
    parameters: { type: "object", properties: { silo: { type: "string", description: "Active silo (BF/BI/SLF)." }, session_id: { type: "string" } }, required: [] },
  },
};
// AGENT_v789_PENDING_ACTIONS - marketing.send_campaign only PREVIEWS (or sends a single test to the
// staff member themselves). BF-Server's pending_action_id stays in the agent session; the real
// send runs through pending.confirm after the staff member's explicit yes.
export type MarketingSendArgs = { channel: string; tag?: string; subject?: string; html?: string; body?: string; test?: string; silo?: string; session_id?: string; staff_email?: string; staff_phone?: string };

const digits = (v: string): string => v.replace(/\D/g, "").slice(-10);

/** A test send may only go to the signed-in staff member's own email or phone. */
export function isOwnTestRecipient(test: string, channel: string, staffEmail?: string, staffPhone?: string): boolean {
  const t = test.trim();
  if (channel === "sms") return Boolean(staffPhone && digits(t).length === 10 && digits(t) === digits(staffPhone));
  return Boolean(staffEmail && t.toLowerCase() === staffEmail.trim().toLowerCase());
}

function campaignPreview(r: Result, payload: Record<string, unknown>): string {
  const count = n(r.recipients) ?? n(r.recipient_count) ?? n(r.count);
  const channel = s(payload.channel) === "sms" ? "text message" : "email";
  const audience = s(payload.tag) ? `everyone tagged "${s(payload.tag)}"` : "the whole opted-in audience";
  const subject = s(payload.subject) ? ` with the subject "${s(payload.subject)}"` : "";
  return `Send this ${channel}${subject} to ${audience}${count != null ? ` - ${count} recipient(s)` : ""}.`;
}

export async function marketingSendCampaign(args: MarketingSendArgs): Promise<Result & { __pending?: unknown }> {
  const channel = s(args?.channel);
  if (!channel) return { ok: false, error: "channel_required" };
  if (channel !== "email" && channel !== "sms") return { ok: false, error: "channel_must_be_email_or_sms" };
  const path = "/api/maya/staff/marketing-send";
  const payload = { channel, tag: s(args?.tag), subject: s(args?.subject), html: s(args?.html), body: s(args?.body), silo: s(args?.silo), session_id: s(args?.session_id) };
  const test = s(args?.test);
  if (test) {
    if (!isOwnTestRecipient(test, channel, s(args?.staff_email), s(args?.staff_phone))) {
      return { ok: false, error: "test_recipient_must_be_you", summary: "A test can only go to your own email address or phone number." };
    }
    return call(path, { ...payload, test, confirm: false });
  }
  const r = await call(path, { ...payload, confirm: false });
  if (!r || r.ok === false) return { ok: false, error: s(r?.error) ?? "preview_failed" };
  return {
    ok: true,
    __pending: { kind: "marketing.send_campaign", path, payload, token: s(r.pending_action_id) ?? null, tokenField: "pending_action_id", preview: s(r.preview_text) ?? campaignPreview(r, payload) },
  };
}
export const MARKETING_SEND_CAMPAIGN_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "marketing.send_campaign",
    description: "Preview a marketing email or SMS campaign to a contact segment. This only PREVIEWS: it returns who it would go to and how many people, and sends nothing. Show the preview to the staff member and ask them to reply yes to send it; nothing is sent until they do. To send a single test to the staff member themselves, pass 'test' with THEIR OWN email (email) or phone (sms); any other test recipient is refused. channel is 'email' (requires subject + html) or 'sms' (requires body). tag picks a segment from marketing.overview; omit tag to reach the whole opted-in audience.",
    parameters: { type: "object", properties: {
      channel: { type: "string", description: "'email' or 'sms'." },
      tag: { type: "string", description: "Segment tag from marketing.overview; omit for the whole opted-in audience." },
      subject: { type: "string", description: "Email subject (email only)." },
      html: { type: "string", description: "Email HTML body (email only)." },
      body: { type: "string", description: "SMS message text (sms only)." },
      test: { type: "string", description: "Optional: the staff member's OWN email or phone, to send them a single test." },
    }, required: ["channel"] },
  },
};
