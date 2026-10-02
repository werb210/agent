// AGENT_MAYA_ADS_v684 - Maya sees every Google Ads keyword and negative we hold, and can add or
// remove negatives for staff (BF-Server v683). Changes are two-step: call without confirm to get
// a preview, show it to the user, and only after they say yes call again with confirm: true and
// the confirm_token from the preview. The server refuses a change that skipped the preview.
import { callBFServer } from "../../integrations/bfServerClient.js";

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
const confirmProps = {
  confirm: { type: "boolean", description: "Leave out (or false) to get a preview. true only after the user said yes to that preview." },
  confirm_token: { type: "string", description: "The confirm_token returned by the preview. Required with confirm: true." },
};

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

export async function adsNegativesAdd(a: { campaign?: string; terms?: string[]; match_type?: string; confirm?: boolean; confirm_token?: string; session_id?: string }): Promise<Result> {
  const terms = Array.isArray(a?.terms) ? a.terms.map(String).filter((t) => t.trim()) : [];
  if (!s(a?.campaign)) return { ok: false, error: "campaign_required" };
  if (!terms.length) return { ok: false, error: "terms_required" };
  return call("/api/maya/staff/ads-negatives/add", { campaign: s(a.campaign), terms, match_type: s(a?.match_type), confirm: a?.confirm === true, confirm_token: s(a?.confirm_token), session_id: s(a?.session_id) });
}
export const ADS_NEGATIVES_ADD_TOOL_DESCRIPTOR = tool("ads.negatives.add",
  "Add negative keywords to a Google Ads campaign. ALWAYS two steps: first call without confirm; it returns what will be added, anything refused (our own keywords, a lead's keyword or a converting search are never blocked) and a confirm_token. Show that to the user and ask them to confirm. Only if they clearly say yes, call again with the same campaign, terms and match_type plus confirm: true and the confirm_token. Match type defaults to EXACT.",
  { campaign: { type: "string", description: "Campaign name or id (see ads.keywords / ads.negatives)." }, terms: { type: "array", items: { type: "string" }, description: "Search terms to block." }, match_type: { type: "string", enum: ["EXACT", "PHRASE", "BROAD"], description: "EXACT blocks only that search (default)." }, ...confirmProps },
  ["campaign", "terms"]);

export async function adsNegativesRemove(a: { id?: string; term?: string; confirm?: boolean; confirm_token?: string; session_id?: string }): Promise<Result> {
  if (!s(a?.id) && !s(a?.term)) return { ok: false, error: "id_or_term_required" };
  return call("/api/maya/staff/ads-negatives/remove", { id: s(a?.id), term: s(a?.term), confirm: a?.confirm === true, confirm_token: s(a?.confirm_token), session_id: s(a?.session_id) });
}
export const ADS_NEGATIVES_REMOVE_TOOL_DESCRIPTOR = tool("ads.negatives.remove",
  "Remove a negative keyword that was added through the portal. ALWAYS two steps: first call without confirm to get a preview and confirm_token, ask the user to confirm, and only on a clear yes call again with confirm: true and the confirm_token.",
  { id: { type: "string", description: "Negative id from ads.negatives." }, term: { type: "string", description: "Or the negative's text." }, ...confirmProps });

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
