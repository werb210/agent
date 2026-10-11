// AGENT_MAYA_ADS_v684 - Maya sees every Google Ads keyword and negative we hold, and can add or
// remove negatives for staff (BF-Server v683). Changes are two-step and the server refuses a
// change that skipped the preview.
// AGENT_v789_PENDING_ACTIONS - the add/remove tools only PREVIEW. The confirm_token stays in the
// agent session (src/maya/pendingActions.ts); the model gets a readable preview and can never
// pass confirm or a token. The change runs through pending.confirm on the staff member's yes.
import { callBFServer } from "../../integrations/bfServerClient.js";
import type { PendingKind } from "../pendingActions.js";

type Result = { ok: boolean; [k: string]: unknown };
const s = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
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

/** What a preview tool hands dispatchTool to keep; never shown to the model. */
export type PendingDraft = { kind: PendingKind; path: string; payload: Record<string, unknown>; token: string | null; tokenField: "confirm_token" | "pending_action_id"; preview: string };
export type PreviewResult = { ok: boolean; [k: string]: unknown; __pending?: PendingDraft };

const list = (v: unknown): Array<Record<string, unknown>> => (Array.isArray(v) ? v.filter((x) => x && typeof x === "object") as Array<Record<string, unknown>> : []);
const termOf = (x: Record<string, unknown>): string => s(x.term) ?? s(x.text) ?? s(x.keyword) ?? "";
const nameOf = (v: unknown): string | undefined => (v && typeof v === "object" ? s((v as Record<string, unknown>).name) ?? s((v as Record<string, unknown>).id) : s(v));

function negativesAddPreview(r: Result, payload: Record<string, unknown>): string {
  const adds = list(r.will_add ?? r.add ?? r.added);
  const refused = list(r.refused ?? r.blocked);
  const campaign = nameOf(r.campaign) ?? s(payload.campaign) ?? "the campaign";
  const match = s(payload.match_type) ?? "EXACT";
  const parts: string[] = [];
  parts.push(adds.length
    ? `Add ${adds.length} negative keyword(s) to ${campaign}: ${adds.map((x) => `"${termOf(x)}" (${s(x.match_type) ?? match})`).join(", ")}.`
    : `Nothing would be added to ${campaign}.`);
  if (refused.length) parts.push(`Will not block: ${refused.map((x) => `"${termOf(x)}"${s(x.reason) ? ` (${s(x.reason)})` : ""}`).join(", ")}.`);
  return parts.join(" ");
}

function negativesRemovePreview(r: Result, payload: Record<string, unknown>): string {
  const neg = (r.negative && typeof r.negative === "object" ? r.negative : r) as Record<string, unknown>;
  const term = termOf(neg) || s(payload.term) || s(payload.id) || "that negative";
  const campaign = nameOf(neg.campaign);
  return `Remove the negative keyword "${term}"${campaign ? ` from ${campaign}` : ""}.`;
}

function asPreview(kind: PendingKind, path: string, payload: Record<string, unknown>, r: Result, text: (r: Result, p: Record<string, unknown>) => string): PreviewResult {
  if (!r || r.ok === false) return { ok: false, error: s(r?.error) ?? "preview_failed" };
  const token = s(r.confirm_token);
  return { ok: true, __pending: { kind, path, payload, token: token ?? null, tokenField: "confirm_token", preview: s(r.preview_text) ?? text(r, payload) } };
}

export async function adsKeywords(a: { days?: number; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-keywords", { days: typeof a?.days === "number" ? a.days : undefined, session_id: s(a?.session_id) });
}
export const ADS_KEYWORDS_TOOL_DESCRIPTOR = tool("ads.keywords",
  "Google Ads keywords: every keyword with its spend, clicks, impressions and conversions over the window, the live list of active keywords in Google Ads, and the campaigns (name and id). Use for 'what keywords are we bidding on', 'which keywords cost the most', 'is X one of our keywords'. days defaults to 30.",
  { days: { type: "number", description: "Look-back window in days (default 30, max 90)." } });

export async function adsNegatives(a: { session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-negatives", { session_id: s(a?.session_id) });
}
export const ADS_NEGATIVES_TOOL_DESCRIPTOR = tool("ads.negatives",
  "Google Ads negative keywords: every negative added through the portal (term, match type, campaign, when, id) and conflicts - negatives in Google Ads that block one of our own keywords. Use for 'what negatives do we have', 'what are we blocking', 'any conflicting negatives'.");

export async function adsNegativesAdd(a: { campaign?: string; terms?: string[]; match_type?: string; session_id?: string }): Promise<PreviewResult> {
  const terms = Array.isArray(a?.terms) ? a.terms.map(String).map((t) => t.trim()).filter(Boolean) : [];
  if (!s(a?.campaign)) return { ok: false, error: "campaign_required" };
  if (!terms.length) return { ok: false, error: "terms_required" };
  const path = "/api/maya/staff/ads-negatives/add";
  const payload = { campaign: s(a.campaign), terms, match_type: s(a?.match_type), session_id: s(a?.session_id) };
  return asPreview("ads.negatives.add", path, payload, await call(path, { ...payload, confirm: false }), negativesAddPreview);
}
export const ADS_NEGATIVES_ADD_TOOL_DESCRIPTOR = tool("ads.negatives.add",
  "Preview adding negative keywords to a Google Ads campaign. This only PREVIEWS: it returns what would be added and anything refused (our own keywords, a lead's keyword or a converting search are never blocked). Show the preview to the staff member and ask them to reply yes to go ahead. Nothing changes until they do. Match type defaults to EXACT.",
  { campaign: { type: "string", description: "Campaign name or id (see ads.keywords / ads.negatives)." }, terms: { type: "array", items: { type: "string" }, description: "Search terms to block." }, match_type: { type: "string", enum: ["EXACT", "PHRASE", "BROAD"], description: "EXACT blocks only that search (default)." } },
  ["campaign", "terms"]);

export async function adsNegativesRemove(a: { id?: string; term?: string; session_id?: string }): Promise<PreviewResult> {
  if (!s(a?.id) && !s(a?.term)) return { ok: false, error: "id_or_term_required" };
  const path = "/api/maya/staff/ads-negatives/remove";
  const payload = { id: s(a?.id), term: s(a?.term), session_id: s(a?.session_id) };
  return asPreview("ads.negatives.remove", path, payload, await call(path, { ...payload, confirm: false }), negativesRemovePreview);
}
export const ADS_NEGATIVES_REMOVE_TOOL_DESCRIPTOR = tool("ads.negatives.remove",
  "Preview removing a negative keyword that was added through the portal. This only PREVIEWS: show the preview to the staff member and ask them to reply yes to go ahead. Nothing changes until they do.",
  { id: { type: "string", description: "Negative id from ads.negatives." }, term: { type: "string", description: "Or the negative's text." } });

// AGENT_MAYA_ADS_INSIGHTS_v712 - read tools for the Ads reports the portal shows (BF-Server
// v712). Each answer carries ad_rules; Maya's advice must follow them.
export async function adsStory(a: { days?: number; by?: string; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-story", { days: typeof a?.days === "number" ? a.days : undefined, by: s(a?.by), session_id: s(a?.session_id) });
}
export const ADS_STORY_TOOL_DESCRIPTOR = tool("ads.story",
  "Ad to dollars: Google Ads spend and clicks through to people in the CRM, applications started, submitted, qualified, funded, estimated commission and return on ad spend, by campaign, ad group, ad or keyword. Use for 'are the ads working', 'what did we get for the spend', 'which campaign brings applications'. days defaults to 90.",
  { days: { type: "number", description: "Look-back window in days (default 90)." }, by: { type: "string", enum: ["campaign", "ad_group", "ad", "keyword"], description: "Group by (default campaign)." } });

export async function adsVisitors(a: { days?: number; filter?: string; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-visitors", { days: typeof a?.days === "number" ? a.days : undefined, filter: s(a?.filter), session_id: s(a?.session_id) });
}
export const ADS_VISITORS_TOOL_DESCRIPTOR = tool("ads.visitors",
  "Website visitors and what each did: landing page, whether they came from an ad (and which campaign/keyword), pages, time on site, and whether they started, submitted or funded an application. Use for 'who came from the ads', 'did anyone from the ads apply', 'recent visitors'. days defaults to 30.",
  { days: { type: "number", description: "Look-back window in days (default 30)." }, filter: { type: "string", enum: ["all", "ad", "identified", "abandoned", "submitted"], description: "Which visitors (default all)." } });

export async function adsDropoff(a: { days?: number; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-dropoff", { days: typeof a?.days === "number" ? a.days : undefined, session_id: s(a?.session_id) });
}
export const ADS_DROPOFF_TOOL_DESCRIPTOR = tool("ads.dropoff",
  "Where applications stop and why: how many started vs submitted, the step each unfinished application stopped at (and how many came from ads), blocking reasons, the field people left on, and time spent per step. Use for 'why aren't people finishing', 'where do they drop off'. days defaults to 90.",
  { days: { type: "number", description: "Look-back window in days (default 90)." } });

export async function adsHealth(a: { session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-health", { session_id: s(a?.session_id) });
}
export const ADS_HEALTH_TOOL_DESCRIPTOR = tool("ads.health",
  "Google connection health: sign-in, conversion uploads to Google Ads, campaign data, Google Analytics, and whether every application from an ad click reached Google. Use for 'is Google tracking working', 'are conversions being sent', 'why does Google show 0 conversions'.");

export async function adsGa4(a: { days?: number; session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ga4", { days: typeof a?.days === "number" ? a.days : undefined, session_id: s(a?.session_id) });
}
export const ADS_GA4_TOOL_DESCRIPTOR = tool("ads.ga4",
  "Website traffic from Google Analytics (GA4): sessions, users, sources and top pages. Use for 'how much website traffic', 'where does traffic come from'. days defaults to 30.",
  { days: { type: "number", description: "Look-back window in days (default 30)." } });

export async function adsAudiences(a: { session_id?: string }): Promise<Result> {
  return call("/api/maya/staff/ads-audiences", { session_id: s(a?.session_id) });
}
export const ADS_AUDIENCES_TOOL_DESCRIPTOR = tool("ads.audiences",
  "Google Customer Match lists: the Applicants and Funded clients lists, how many people are on each, and how many applicants have not been sent yet. Staff send applicants themselves from Marketing > Ads > Google > Audiences. Use for 'how big are our audiences', 'who is in the customer match lists'.");
