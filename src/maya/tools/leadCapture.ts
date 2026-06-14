// AGENT_BLOCK_v4_VISITOR_TOOLS_v1
// Visitor-audience tools. lead.capture pushes a website lead into
// BF's CRM via BF-Server's existing /api/crm/startup-waitlist
// endpoint (which the marketing website already uses for the
// startup waitlist flow). apply.start_url returns the canonical
// /apply URL — the public funding application wizard.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type LeadCaptureArgs = {
  name?: string;
  email?: string;
  phone?: string;
  company_name?: string;
  message?: string;
  utm_source?: string;
};

export type LeadCaptureResult = {
  ok: boolean;
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

export async function leadCapture(args: LeadCaptureArgs): Promise<LeadCaptureResult> {
  const email = s(args?.email);
  const name = s(args?.name);
  const phone = s(args?.phone);
  const company = s(args?.company_name);
  const message = s(args?.message);
  if (!email && !phone) {
    return { ok: false, summary: "Need at least an email or phone to capture the lead." };
  }
  if (email && !looksLikeEmail(email)) {
    return { ok: false, summary: "Email looks invalid." };
  }
  try {
    await callBFServer("/api/crm/startup-waitlist", {
      method: "POST",
      body: {
        email: email ?? "",
        name,
        phone,
        companyName: company,
        message,
        channel: "website",
        source: "maya_visitor_tool",
        utm_source: s(args?.utm_source),
      },
    });
    return {
      ok: true,
      summary: `Lead captured for ${email ?? phone ?? "visitor"}. The team will follow up.`,
    };
  } catch (e: any) {
    return { ok: false, summary: `lead_capture_failed: ${e?.message ?? "unknown"}` };
  }
}

export const LEAD_CAPTURE_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "lead.capture",
    description:
      "Capture a website visitor's contact information so the team can follow up. Use when the visitor asks to be contacted, says 'have someone call me', or volunteers their email/phone. Require at least an email or phone.",
    parameters: {
      type: "object",
      properties: {
        name: { type: "string", description: "Visitor's full name, if provided." },
        email: { type: "string", description: "Visitor's email address." },
        phone: { type: "string", description: "Visitor's phone number." },
        company_name: { type: "string", description: "Visitor's company name, if provided." },
        message: { type: "string", description: "Short context about why they're interested." },
        utm_source: { type: "string", description: "Attribution source, if known." },
      },
    },
  },
};

export type ApplyStartUrlArgs = Record<string, never>;
export type ApplyStartUrlResult = {
  ok: boolean;
  url: string;
  summary: string;
};

export async function applyStartUrl(_args?: ApplyStartUrlArgs): Promise<ApplyStartUrlResult> {
  const url = "https://client.boreal.financial/";
  return {
    ok: true,
    url,
    summary: `Start an application at ${url}`,
  };
}

export const APPLY_START_URL_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "apply.start_url",
    description:
      "Return the URL where a visitor can start a Boreal Financial loan application. Use when the visitor says 'I want to apply', 'how do I get started', 'where do I sign up'. IMPORTANT: always CALL this tool to get the real URL, then use the returned `url` value verbatim in your reply. Never write the literal text 'apply.start_url' as a link or URL — that is the tool name, not a URL.",
    parameters: {
      type: "object",
      properties: {},
    },
  },
};
