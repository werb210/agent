// AGENT_BLOCK_v115_VISITOR_IDENTIFY_v1
// Front-of-conversation gate for the visitor audience. The model
// is instructed by the system prompt to call this tool on its
// first turn and not answer anything else until it succeeds.
// Persists the lead through BF-Server's existing waitlist endpoint
// (same plumbing as lead.capture) tagged source='maya_visitor_intake'.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type VisitorIdentifyArgs = {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
};

export type VisitorIdentifyResult = {
  ok: boolean;
  identifiedAt?: string;
  summary: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function looksLikePhone(v: string): boolean {
  // Permissive — accept anything with at least 7 digits.
  return (v.match(/\d/g) ?? []).length >= 7;
}

export async function visitorIdentify(args: VisitorIdentifyArgs): Promise<VisitorIdentifyResult> {
  const name = s(args?.name);
  const email = s(args?.email);
  const phone = s(args?.phone);
  const company = s(args?.company_name);

  if (!name) {
    return { ok: false, summary: "Need the visitor's name to continue." };
  }
  if (!email && !phone) {
    return { ok: false, summary: "Need an email or phone number to continue." };
  }
  if (email && !looksLikeEmail(email)) {
    return { ok: false, summary: "Email looks invalid — please confirm." };
  }
  if (phone && !looksLikePhone(phone)) {
    return { ok: false, summary: "Phone number looks invalid — please confirm." };
  }

  try {
    await callBFServer("/api/crm/startup-waitlist", {
      method: "POST",
      body: {
        email: email ?? "",
        name,
        phone,
        companyName: company,
        channel: "website",
        source: "maya_visitor_intake",
      },
    });
    return {
      ok: true,
      identifiedAt: new Date().toISOString(),
      summary: `Identified ${name} (${email ?? phone}). Ready to chat.`,
    };
  } catch (e: any) {
    return { ok: false, summary: `visitor_identify_failed: ${e?.message ?? "unknown"}` };
  }
}

export const VISITOR_IDENTIFY_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "visitor.identify",
    description:
      "Record the website visitor's name and at least one of email/phone before any other interaction. Call this on the first turn with whatever the visitor gave you, then proceed.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Visitor's name (first + last preferred)." },
        email: { type: "string", description: "Visitor's email address." },
        phone: { type: "string", description: "Visitor's phone number." },
        company_name: { type: "string", description: "Visitor's company name, if mentioned." },
      },
      required: ["name"],
    },
  },
};
