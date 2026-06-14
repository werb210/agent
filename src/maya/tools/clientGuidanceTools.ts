// MAYA_BATCH_A_CLIENT_READS_v1
// Eight client-audience, READ-ONLY tools. The data-backed ones reuse the same
// payload as application.my_status / docs.checklist (GET /api/applications/:id
// via fetchApplicationStatus) and parse defensively — any field that is absent
// degrades to a best-effort message rather than throwing. The guidance tools
// (field help, document explainer, timeline) are static and need no server.
import { fetchApplicationStatus } from "../../integrations/bfServerClient.js";

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}
function lower(v: unknown): string {
  return String(v ?? "").toLowerCase();
}
async function loadApp(applicationId: string | null): Promise<any | null> {
  if (!applicationId) return null;
  try {
    const r: any = await fetchApplicationStatus(applicationId);
    return r && typeof r === "object" ? r : null;
  } catch {
    return null;
  }
}
function stageOf(r: any): string | null {
  return s(r?.pipeline_state) ?? s(r?.current_stage) ?? s(r?.status);
}
function docType(d: any): string {
  return s(d?.document_category) ?? s(d?.document_type) ?? "document";
}

const FIELD_HELP: Record<string, string> = {
  legal_business_name: "The exact registered name of your business as it appears on your incorporation or registration documents.",
  business_name: "The exact registered name of your business as it appears on your incorporation or registration documents.",
  time_in_business: "How long the business has been operating, from its start/registration date to today. Estimate in years and months if unsure.",
  in_business_since: "The month and year the business started operating or was registered.",
  annual_revenue: "Your business's total gross sales over the last 12 months, before expenses.",
  requested_amount: "How much financing you'd like to apply for. A range is fine; the final amount depends on underwriting.",
  industry: "The general nature of your business (e.g., trucking, construction, retail). Pick the closest match.",
  use_of_funds: "What you'll use the money for (e.g., equipment, working capital, expansion). This helps match you to the right product.",
  ownership_percentage: "The share of the business each owner holds. All owners' percentages should add up to 100%.",
  sin: "Your Social Insurance Number. It's encrypted and used only for the credit check required to underwrite the application.",
  annual_profit: "Your business's net income (revenue minus expenses) over the last 12 months.",
};
export type FieldHelpArgs = { field?: string };
export async function applyFieldHelp(args: FieldHelpArgs) {
  const key = (s(args?.field) ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const help = FIELD_HELP[key];
  if (help) return { ok: true, field: key, help };
  return {
    ok: true,
    field: key || null,
    help: "I can explain any field on the application — tell me which one (for example: time in business, annual revenue, use of funds, ownership percentage). You can always start the application now and refine details later.",
  };
}
export const APPLY_FIELD_HELP_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "apply.field_help",
    description:
      "Explain in plain language what a specific field on the loan application wizard means or wants (e.g. 'what does time in business mean', 'what should I put for use of funds'). Use when the applicant is filling out the form and asks what a field means.",
    parameters: { type: "object", properties: { field: { type: "string", description: "The field the applicant is asking about." } }, required: [] },
  },
};

const DOC_EXPLAIN: Record<string, { why: string; good: string }> = {
  bank_statements: { why: "Lenders use them to verify cash flow, average balances, and that the business can service the financing.", good: "The last 6 months, all pages, as the official PDF from your bank (not screenshots)." },
  financial_statements: { why: "They show the financial health and profitability of the business.", good: "Your most recent year-end statements (balance sheet + income statement); accountant-prepared is best." },
  balance_sheet: { why: "It shows what the business owns and owes at a point in time.", good: "Your most recent year-end balance sheet, ideally accountant-prepared." },
  profit_loss: { why: "It shows revenue, expenses, and profit over a period.", good: "Your most recent year-end profit & loss (income) statement." },
  tax_returns: { why: "They corroborate reported revenue and income.", good: "The business's most recent filed return, all schedules included." },
  ar_aging: { why: "It shows who owes the business money and how overdue it is — important for asset-based facilities.", good: "A current accounts-receivable aging report exported from your accounting software." },
  ap_aging: { why: "It shows what the business owes suppliers and how overdue it is.", good: "A current accounts-payable aging report exported from your accounting software." },
  void_cheque: { why: "It confirms the bank account for funding.", good: "A void cheque or a bank-issued direct-deposit form for the business account." },
  id: { why: "It verifies the identity of the business owner(s).", good: "A clear photo of a valid government-issued photo ID, not expired." },
};
export type DocsExplainArgs = { document_type?: string };
export async function docsExplain(args: DocsExplainArgs) {
  const key = (s(args?.document_type) ?? "").toLowerCase().replace(/[\s-]+/g, "_");
  const hit = DOC_EXPLAIN[key];
  if (hit) return { ok: true, document_type: key, why: hit.why, good_version: hit.good };
  return {
    ok: true,
    document_type: key || null,
    why: "Each requested document helps the lender verify your business and underwrite the application.",
    good_version: "Clear, complete, official copies (PDF where possible). Tell me which document you're unsure about and I'll explain it. Remember you can start the application now and upload documents afterward.",
  };
}
export const DOCS_EXPLAIN_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "docs.explain",
    description:
      "Explain why a requested document is needed and what a good version looks like (e.g. 'why do you need my bank statements', 'what counts as financial statements'). Use when an applicant asks about a document on their checklist.",
    parameters: { type: "object", properties: { document_type: { type: "string", description: "The document the applicant is asking about." } }, required: [] },
  },
};

export type DocsRejectionsArgs = { application_id?: string };
export async function docsRejections(args: DocsRejectionsArgs) {
  const applicationId = s(args?.application_id);
  if (!applicationId) return { ok: false, summary: "application_id is required." };
  const r = await loadApp(applicationId);
  if (!r) return { ok: false, summary: "Application not found." };
  const docs = Array.isArray(r.documents) ? r.documents : [];
  const rejected = docs
    .filter((d: any) => d && typeof d === "object" && ["rejected", "declined"].includes(lower(d.status ?? d.review_status)))
    .map((d: any) => ({
      document_type: docType(d),
      reason: s(d.review_reason) ?? s(d.rejection_reason) ?? s(d.reason) ?? s(d.review_note) ?? null,
    }));
  const summary = rejected.length
    ? `${rejected.length} document(s) need to be re-uploaded: ${rejected.map((x: { document_type: string; reason: string | null }) => x.document_type + (x.reason ? ` (${x.reason})` : "")).join("; ")}. Upload a corrected version and you're good to continue.`
    : "None of your documents have been rejected — nothing to fix right now.";
  return { ok: true, application_id: applicationId, rejected, summary };
}
export const DOCS_REJECTIONS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "docs.rejections",
    description:
      "List any documents on the applicant's application that staff have rejected, with the reason and how to fix them. Use when the applicant asks 'was anything rejected', 'why was my document declined', 'what do I need to re-upload'.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The BF application UUID, supplied by the authenticated session." } }, required: ["application_id"] },
  },
};

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return null;
}
export type OfferExplainArgs = { application_id?: string };
export async function offerExplain(args: OfferExplainArgs) {
  const applicationId = s(args?.application_id);
  if (!applicationId) return { ok: false, summary: "application_id is required." };
  const r = await loadApp(applicationId);
  if (!r) return { ok: false, summary: "Application not found." };
  const raw = Array.isArray(r.offers) ? r.offers : Array.isArray(r.lender_matches) ? r.lender_matches : [];
  const offers = raw.map((o: any) => ({
    lender: s(o?.lenderName) ?? s(o?.lender_name) ?? s(o?.lender) ?? null,
    product: s(o?.productName) ?? s(o?.product_name) ?? s(o?.product) ?? null,
    amount: num(o?.amount) ?? num(o?.approved_amount) ?? null,
    rate: s(o?.rate) ?? (num(o?.rate) != null ? String(num(o?.rate)) : null),
    term: s(o?.term) ?? null,
  }));
  if (!offers.length) {
    return { ok: true, application_id: applicationId, offers: [], summary: "You don't have any lender offers yet. I'll let you know here as soon as one comes through." };
  }
  const summary = `You have ${offers.length} offer(s): ${offers
    .map((o: { lender: string | null; amount: number | null; rate: string | null; term: string | null }) => `${o.lender ?? "a lender"}${o.amount ? ` for $${o.amount.toLocaleString()}` : ""}${o.rate ? ` at ${o.rate}` : ""}${o.term ? `, ${o.term}` : ""}`)
    .join("; ")}. I can walk through what each one means — accepting is always your decision.`;
  return { ok: true, application_id: applicationId, offers, summary };
}
export const OFFER_EXPLAIN_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "offer.explain",
    description:
      "Summarize and explain in plain language the lender offer(s)/term sheet(s) on the applicant's application — lender, amount, rate, term — and help them compare. Read-only; never accepts or declines an offer. Use when the applicant asks 'what are my offers', 'explain this offer', 'which one is better'.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The BF application UUID, supplied by the authenticated session." } }, required: ["application_id"] },
  },
};

export type NextStepArgs = { application_id?: string };
export async function applicationNextStep(args: NextStepArgs) {
  const applicationId = s(args?.application_id);
  if (!applicationId) return { ok: false, summary: "application_id is required." };
  const r = await loadApp(applicationId);
  if (!r) return { ok: false, summary: "Application not found." };
  const docs = Array.isArray(r.documents) ? r.documents : [];
  const rejected = docs.filter((d: any) => ["rejected", "declined"].includes(lower(d?.status ?? d?.review_status)));
  const missing = docs.filter((d: any) => !["accepted", "uploaded", "complete"].includes(lower(d?.status)) && !["rejected", "declined"].includes(lower(d?.status ?? d?.review_status)));
  const sigDone = ["signed", "completed", "complete"].includes(lower(r.signature_status ?? r.signnow_status ?? r.esign_status));
  let next: string;
  if (rejected.length) next = `Re-upload ${rejected.length} document(s) that were sent back: ${rejected.map(docType).join(", ")}.`;
  else if (missing.length) next = `Upload your remaining document(s): ${missing.map(docType).join(", ")}. You can do this any time — it won't block the rest of your application.`;
  else if (r.signature_status != null && !sigDone) next = "Sign your application — your e-signature is the last step.";
  else next = "You're all set on your end. The team is reviewing — I'll keep you posted on status here.";
  return { ok: true, application_id: applicationId, stage: stageOf(r), next_step: next, summary: next };
}
export const APPLICATION_NEXT_STEP_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.next_step",
    description:
      "Tell the applicant the single most important next thing they need to do on their application (re-upload a rejected doc, upload a missing doc, sign, or wait). Use when they ask 'what's next', 'what do I need to do now', 'what's the next step'.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The BF application UUID, supplied by the authenticated session." } }, required: ["application_id"] },
  },
};

export type SignatureStatusArgs = { application_id?: string };
export async function signatureStatus(args: SignatureStatusArgs) {
  const applicationId = s(args?.application_id);
  if (!applicationId) return { ok: false, summary: "application_id is required." };
  const r = await loadApp(applicationId);
  if (!r) return { ok: false, summary: "Application not found." };
  const raw = s(r.signature_status) ?? s(r.signnow_status) ?? s(r.esign_status);
  if (!raw) return { ok: true, application_id: applicationId, status: null, summary: "There's no e-signature step on your application yet. I'll let you know here when one is ready." };
  const done = ["signed", "completed", "complete"].includes(raw.toLowerCase());
  const summary = done
    ? "Your application is signed — that step is complete."
    : `Your e-signature is still pending (status: ${raw}). When you're ready, open the signing step in the app to finish it.`;
  return { ok: true, application_id: applicationId, status: raw, signed: done, summary };
}
export const SIGNATURE_STATUS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "signature.status",
    description:
      "Report whether the applicant's e-signature (SignNow) step is done or still pending. Read-only — does not resend the signing link. Use when they ask 'did I sign', 'is my signature done', 'do I still need to sign'.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The BF application UUID, supplied by the authenticated session." } }, required: ["application_id"] },
  },
};

const STAGE_TIMELINE: Array<{ match: RegExp; estimate: string }> = [
  { match: /(new|draft|started|in[\s_-]*progress|requires?[\s_-]*docs|document)/i, estimate: "Once all your documents are in, initial review typically takes 1–2 business days." },
  { match: /(review|underwrit|processing|submitted)/i, estimate: "You're in review — lenders usually respond within 1–3 business days." },
  { match: /(offer|approved|matched|term[\s_-]*sheet)/i, estimate: "You have movement on offers — funding can often follow within a few business days of accepting." },
  { match: /(funded|closed|complete|declined)/i, estimate: "This application has reached a final stage." },
];
export type TimelineArgs = { application_id?: string; stage?: string };
export async function applicationTimelineEstimate(args: TimelineArgs) {
  const applicationId = s(args?.application_id);
  let stage = s(args?.stage);
  if (!stage && applicationId) {
    const r = await loadApp(applicationId);
    stage = stageOf(r);
  }
  const hit = stage ? STAGE_TIMELINE.find((x) => x.match.test(stage as string)) : null;
  const estimate = hit?.estimate ?? "Timelines depend on your documents and lender response. As a rule of thumb, most applicants hear back within a few business days of completing their file.";
  return { ok: true, stage: stage ?? null, estimate, summary: estimate + " These are general estimates, not guarantees." };
}
export const APPLICATION_TIMELINE_ESTIMATE_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.timeline_estimate",
    description:
      "Give the applicant a general estimate of how long the next phase of their application takes, based on their current stage. Always framed as a non-binding estimate. Use when they ask 'how long until I hear back', 'when will I get a decision', 'how much longer'.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The BF application UUID, supplied by the authenticated session." }, stage: { type: "string", description: "Optional current stage if already known." } }, required: [] },
  },
};

export type ResumeLinkArgs = { application_id?: string };
export async function applicationResumeLink(args: ResumeLinkArgs) {
  const applicationId = s(args?.application_id);
  if (!applicationId) return { ok: false, summary: "application_id is required." };
  const r = await loadApp(applicationId);
  if (!r) return { ok: false, summary: "Application not found." };
  const link = s(r.continuation_url) ?? s(r.resume_url) ?? s(r.continue_url) ?? null;
  if (link) return { ok: true, application_id: applicationId, resume_url: link, summary: `You can pick up right where you left off here: ${link}` };
  return {
    ok: true,
    application_id: applicationId,
    resume_url: null,
    summary: "Your progress is saved. Just reopen the Boreal application app and sign in with your phone — your application will be waiting where you left off.",
  };
}
export const APPLICATION_RESUME_LINK_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.resume_link",
    description:
      "Show the applicant how to resume their saved application (returns the continuation link if the server provides one, otherwise tells them to sign back in). Read-only — does not text or email the link. Use when they ask 'how do I get back to my application', 'where did I leave off', 'send me my resume link'.",
    parameters: { type: "object", properties: { application_id: { type: "string", description: "The BF application UUID, supplied by the authenticated session." } }, required: ["application_id"] },
  },
};
