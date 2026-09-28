// AGENT_MAYA_INSIGHTS_v657 - six read-only staff tools over BF-Server /api/maya/staff/*
import { callBFServer } from "../../integrations/bfServerClient.js";

type Result = { ok: boolean; [k: string]: unknown };
const s = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const n = (v: unknown): number | undefined => {
  const x = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(x) ? x : undefined;
};
async function call(path: string, body: Record<string, unknown>): Promise<Result> {
  try {
    const r = await callBFServer<Result>(path, { method: "POST", body });
    return r && typeof r === "object" ? r : { ok: false, error: "empty_response" };
  } catch {
    return { ok: false, error: "request_failed" };
  }
}
const tool = (name: string, description: string, properties: Record<string, unknown> = {}, required: string[] = []) => ({
  type: "function" as const,
  function: { name, description, parameters: { type: "object", properties: { ...properties, session_id: { type: "string", description: "Optional session id." } }, required } },
});
const silo = { silo: { type: "string", description: "Active silo (BF/BI/SLF). Defaults to BF." } };

export async function adsPerformance(a: { days?: number; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-performance", { days: n(a?.days), session_id: s(a?.session_id) });
}
export const ADS_PERFORMANCE_TOOL_DESCRIPTOR = tool("ads.performance", "Google Ads results: spend, conversions and cost per conversion by campaign (with the previous period for comparison), ad leads, wasted spend (search terms that cost money and never converted), the search terms that did convert, and active negative keywords. Use for 'how did Google Ads do this week', 'what's wasting money', 'which searches convert', 'cost per lead'. days defaults to 7. Read-only: it never adds or removes negatives.", { days: { type: "number", description: "Look-back window in days (default 7, max 90)." } });

export async function commsOverview(a: { silo?: string; user_email?: string; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/comms-overview", { silo: s(a?.silo), user_email: s(a?.user_email), session_id: s(a?.session_id) });
}
export const COMMS_OVERVIEW_TOOL_DESCRIPTOR = tool("comms.overview", "Who is waiting on us: contacts whose last text was to us (oldest first), missed calls, voicemails with transcripts, recent call AI summaries, open issues, and the staff member's unread Team chat. Use for 'who's waiting on a reply', 'what did I miss', 'any voicemails', 'what happened on recent calls'. Email is not included (it is read live from Outlook).", silo);

export async function contactPicture(a: { contact_id?: string; company_id?: string; silo?: string; session_id?: string }): Promise<Result> {
  const contactId = s(a?.contact_id); const companyId = s(a?.company_id);
  if (!contactId && !companyId) return { ok: false, error: "contact_id_or_company_id_required" };
  return call("/api/maya/staff/contact-picture", { contact_id: contactId, company_id: companyId, silo: s(a?.silo), session_id: s(a?.session_id) });
}
export const CONTACT_PICTURE_TOOL_DESCRIPTOR = tool("contact.picture", "The full picture on one contact or company: profile, applications, how they found us (Google Ads click, keyword and search term, referral, capital readiness check), website journey, Maya chat, per application the client's to-dos, documents, lender submissions, offers, signing and PGI stage, their Boreal Insurance record, and recent activity. Use for 'give me the full picture on X', 'what's the story with this client', 'where did this lead come from'. Resolve a name with contact.find first; use the id on screen for 'this contact'.", { contact_id: { type: "string", description: "Contact id." }, company_id: { type: "string", description: "Company id (alternative to contact_id)." }, ...silo });

export async function automationsOverview(a: { silo?: string; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/automations-overview", { silo: s(a?.silo), session_id: s(a?.session_id) });
}
export const AUTOMATIONS_OVERVIEW_TOOL_DESCRIPTOR = tool("automations.overview", "Automations and marketing sequences: which are enabled or in test mode, their triggers, and how many people are active, completed or failed in each. Use for 'which automations are running', 'is the new-lead automation on', 'how many are in the nurture sequence'.", silo);

export async function referrersOverview(a: { session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/referrers-overview", { session_id: s(a?.session_id) });
}
export const REFERRERS_OVERVIEW_TOOL_DESCRIPTOR = tool("referrers.overview", "Referral partners: each referrer's referrals, applications, commissions credited but unpaid, and paid. Use for 'who are our best referrers', 'how much commission do we owe', 'how is Pat doing'.");

export async function todoStatus(a: { application_id?: string; session_id?: string }): Promise<Result> {
  const appId = s(a?.application_id);
  if (!appId) return { ok: false, error: "application_id_required" };
  return call("/api/maya/staff/todo-status", { application_id: appId, session_id: s(a?.session_id) });
}
export const TODO_STATUS_TOOL_DESCRIPTOR = tool("todo.status", "What the client still has to do on a deal (documents, forms, PGI, SBA forms, signing; rejected items flagged), what they have completed, and documents that were shared in from their other applications. Use for 'what are we waiting on from the client', 'what's outstanding on this deal'. Provide application_id (the one on screen for 'this deal').", { application_id: { type: "string", description: "The application." } }, ["application_id"]);
