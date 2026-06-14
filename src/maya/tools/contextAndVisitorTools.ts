// MAYA_BATCH_C_VISITOR_AND_CONTEXT_v1
// Visitor-audience read tools (capital readiness, pre-qualification, industry
// guidance, document preview, lender info, waitlist) plus one client tool
// (application.find_mine) that resolves a signed-in client's own application(s)
// by phone so Maya "knows them" without being handed an application_id.
// All read-only; waitlist.join is a customer self-service capture.
import { callBFServer } from "../../integrations/bfServerClient.js";

function s(v: unknown): string | undefined {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}
function n(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

export type ReadinessArgs = { years_in_business?: number; annual_revenue?: number; monthly_revenue?: number; requested_amount?: number };
export async function capitalReadinessCheck(args: ReadinessArgs) {
  const years = n(args?.years_in_business);
  const annual = n(args?.annual_revenue);
  const monthly = n(args?.monthly_revenue);
  const amount = n(args?.requested_amount);
  let score = 0;
  const tips: string[] = [];
  if (years != null) { if (years >= 2) score += 35; else if (years >= 1) { score += 20; tips.push("Most lenders prefer 2+ years in business; under 2 years narrows your options."); } else { score += 5; tips.push("Under 1 year in business limits you to startup-friendly options."); } }
  else tips.push("Tell me your time in business for a sharper read.");
  const annualEff = annual ?? (monthly != null ? monthly * 12 : undefined);
  if (annualEff != null) { if (annualEff >= 250000) score += 35; else if (annualEff >= 100000) { score += 22; } else { score += 10; tips.push("Higher revenue strengthens approval odds and pricing."); } }
  else tips.push("Share your annual or average monthly revenue to factor in cash flow.");
  if (amount != null && annualEff != null) { const ratio = amount / annualEff; if (ratio <= 0.5) score += 30; else if (ratio <= 1) { score += 18; } else { score += 5; tips.push("You're requesting a large amount relative to revenue — consider a smaller initial ask."); } }
  else score += 15;
  score = Math.max(0, Math.min(100, score));
  const band = score >= 70 ? "strong" : score >= 45 ? "moderate" : "early";
  const summary = `Readiness looks ${band} (about ${score}/100). ${tips.length ? tips.join(" ") : "You're in good shape — you can start your application now and add documents later."}`;
  return { ok: true, score, band, tips, summary };
}
export const CAPITAL_READINESS_CHECK_TOOL_DESCRIPTOR = { type: "function" as const, function: { name: "capital.readiness_check", description: "Give a prospective customer a quick capital-readiness read (a 0-100 score and tips) from a few inputs: years in business, revenue, and how much they want. Use when a website visitor asks 'am I ready', 'would I qualify', 'how do my chances look'. Ask for any missing inputs first, then score.", parameters: { type: "object", properties: { years_in_business: { type: "number" }, annual_revenue: { type: "number" }, monthly_revenue: { type: "number" }, requested_amount: { type: "number" } }, required: [] } } };

export type PrequalArgs = { country?: string; years_in_business?: number; annual_revenue?: number; requested_amount?: number };
export async function prequalEstimate(args: PrequalArgs) {
  const years = n(args?.years_in_business); const annual = n(args?.annual_revenue); const amount = n(args?.requested_amount); const country = s(args?.country); const need: string[] = [];
  if (years == null) need.push("time in business"); if (annual == null) need.push("annual revenue");
  if (need.length) return { ok: true, likely: null, summary: `To estimate what you'd likely qualify for, I need your ${need.join(" and ")}. You can also just start the application — it only takes a few minutes.` };
  const products: string[] = []; const y = years as number; const av = annual as number;
  if (y >= 2 && av >= 250000) products.push("term loans", "lines of credit", "equipment financing"); else if (y >= 1 && av >= 100000) products.push("lines of credit", "equipment financing", "merchant cash advance"); else products.push("startup-friendly options and equipment financing");
  const capHint = amount != null && annual != null && amount > annual ? " Note your requested amount is above your annual revenue, which may reduce options." : "";
  const summary = `Based on what you shared${country ? ` (${country})` : ""}, you'd likely be a fit for: ${products.join(", ")}.${capHint} This is an estimate, not an approval — applying gives you real lender matches.`;
  return { ok: true, likely: products, summary };
}
export const PREQUAL_ESTIMATE_TOOL_DESCRIPTOR = { type: "function" as const, function: { name: "prequal.estimate", description: "Estimate which financing products a visitor would likely qualify for, from country, time in business, revenue, and amount. Always framed as an estimate, not an approval. Use when they ask 'what could I qualify for', 'what are my options'.", parameters: { type: "object", properties: { country: { type: "string" }, years_in_business: { type: "number" }, annual_revenue: { type: "number" }, requested_amount: { type: "number" } }, required: [] } } };

const INDUSTRY_GUIDANCE: Array<{ match: RegExp; text: string }> = [
  { match: /truck|logistic|freight|transport|fleet/i, text: "For trucking/logistics, equipment & vehicle financing and factoring (against your freight invoices) are the most common fits, plus lines of credit for fuel and maintenance cash flow." },
  { match: /construct|contractor|build/i, text: "For construction, lines of credit and equipment financing are common, along with invoice factoring to bridge progress-billing gaps." },
  { match: /retail|store|shop|ecommerce|e-commerce/i, text: "For retail, inventory financing, lines of credit, and merchant cash advances (against card sales) are the usual fits." },
  { match: /restaurant|food|hospitality|cafe/i, text: "For restaurants/hospitality, equipment financing and merchant cash advances are common, plus lines of credit for seasonal swings." },
  { match: /manufactur|factory|industrial/i, text: "For manufacturing, equipment financing, purchase-order financing, and lines of credit against receivables are common." },
  { match: /medical|dental|clinic|health/i, text: "For medical/dental, equipment financing and term loans for build-outs are common, plus lines of credit for working capital." },
];
export type IndustryArgs = { industry?: string };
export async function industryGuidance(args: IndustryArgs) {
  const industry = s(args?.industry);
  if (!industry) return { ok: true, summary: "Tell me your industry (e.g., trucking, construction, retail) and I'll point you to the financing that usually fits best." };
  const hit = INDUSTRY_GUIDANCE.find((g) => g.match.test(industry));
  const text = hit?.text ?? `Boreal works across most industries. For ${industry}, common fits include term loans, lines of credit, and equipment financing — applying gives you matches tailored to your business.`;
  return { ok: true, industry, summary: text };
}
export const INDUSTRY_GUIDANCE_TOOL_DESCRIPTOR = { type: "function" as const, function: { name: "industry.guidance", description: "Give industry-tailored financing guidance to a visitor (e.g. 'I run a trucking company — what works for me'). Returns the product types that typically fit that industry.", parameters: { type: "object", properties: { industry: { type: "string", description: "The visitor's industry." } }, required: [] } } };

const DOC_PREVIEW: Record<string, string[]> = { default: ["6 months of business bank statements", "basic business details (legal name, time in business, revenue)", "a government-issued photo ID for the owner(s)"], equipment: ["6 months of business bank statements", "a quote or invoice for the equipment", "business details + owner ID"], factoring: ["6 months of business bank statements", "an accounts-receivable aging report", "business details + owner ID"] };
export type DocPreviewArgs = { product?: string };
export async function applyDocPreview(args: DocPreviewArgs) { const product = (s(args?.product) ?? "").toLowerCase(); const key = /equip/.test(product) ? "equipment" : /factor|receivable/.test(product) ? "factoring" : "default"; const docs = DOC_PREVIEW[key]; return { ok: true, product: key, documents: docs, summary: `To apply${key !== "default" ? ` for ${key}` : ""} you'll generally need: ${docs.join("; ")}. Good news — you can start the application now and upload documents afterward; nothing has to be ready first.` }; }
export const APPLY_DOC_PREVIEW_TOOL_DESCRIPTOR = { type: "function" as const, function: { name: "apply.doc_preview", description: "Tell a visitor what documents they'll generally need to apply (optionally for a specific product). Always reassures them they can start now and upload later. Use when they ask 'what do I need to apply', 'what documents are required'.", parameters: { type: "object", properties: { product: { type: "string", description: "Optional product (e.g. equipment, factoring)." } }, required: [] } } };

export async function infoLenders() { return { ok: true, summary: "Boreal works with a broad network of lenders across term loans, lines of credit, equipment & vehicle financing, factoring, merchant cash advances, and more — so we can match you to options a single bank couldn't. The best way to see who fits your business is to start an application and get real matches." }; }
export const INFO_LENDERS_TOOL_DESCRIPTOR = { type: "function" as const, function: { name: "info.lenders", description: "Answer a visitor's questions about Boreal's lender network in marketing terms (breadth of lenders and product types). Use when they ask 'how many lenders do you have', 'who do you work with', 'what kinds of financing'. Does not expose internal lender records.", parameters: { type: "object", properties: {}, required: [] } } };

export type WaitlistArgs = { name?: string; email?: string; phone?: string; company_name?: string };
export async function waitlistJoin(args: WaitlistArgs) { const email = s(args?.email); const phone = s(args?.phone); if (!email && !phone) return { ok: false, summary: "I just need an email or phone to add you to the startup waitlist." }; try { await callBFServer("/api/crm/startup-waitlist", { method: "POST", body: { name: s(args?.name), email, phone, company_name: s(args?.company_name), source: "maya" } }); return { ok: true, summary: "You're on the startup waitlist — we'll reach out as soon as there's a fit. Thanks!" }; } catch { return { ok: false, summary: "I couldn't add you just now — please try Talk to a Human." }; } }
export const WAITLIST_JOIN_TOOL_DESCRIPTOR = { type: "function" as const, function: { name: "waitlist.join", description: "Add a pre-revenue or early-stage visitor to Boreal's startup waitlist when they're not yet a fit for financing. Use when they ask to be notified or are too early to qualify. Needs an email or phone.", parameters: { type: "object", properties: { name: { type: "string" }, email: { type: "string" }, phone: { type: "string" }, company_name: { type: "string" } }, required: [] } } };

export type FindMineArgs = { phone?: string; session_id?: string };
export async function applicationFindMine(args: FindMineArgs) { const phone = s(args?.phone); if (!phone) return { ok: false, error: "phone_required", summary: "I need your phone number on file to look up your application." }; try { const r = await callBFServer<{ ok: boolean; applications?: unknown[]; latestDocs?: unknown; summary?: string }>("/api/maya/staff/applications-by-phone", { method: "POST", body: { phone, session_id: s(args?.session_id) } }); if (!r || typeof r !== "object") return { ok: false, error: "empty_response" }; return r; } catch { return { ok: false, error: "find_mine_failed", summary: "I couldn't look up your application just now." }; } }
export const APPLICATION_FIND_MINE_TOOL_DESCRIPTOR = { type: "function" as const, function: { name: "application.find_mine", description: "Look up the signed-in client's own application(s) by their phone number on file — returns their applications, stage, and any outstanding documents. Use this proactively when a signed-in client asks about their application, status, or what's next and you have their phone but no specific application id. The host supplies the authenticated phone.", parameters: { type: "object", properties: { phone: { type: "string", description: "The authenticated client's phone, supplied by the host." }, session_id: { type: "string", description: "Optional session id." } }, required: [] } } };
