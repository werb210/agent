// MAYA_STAFF_UNDERWRITING_SUMMARY — read-only underwriting view of a deal.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type ApplicationUnderwritingSummaryArgs = { application_id: string; session_id?: string };
export type ApplicationUnderwritingSummaryResult = {
  ok: boolean;
  summary?: Record<string, unknown>;
  error?: string;
};

export async function applicationUnderwritingSummary(
  args: ApplicationUnderwritingSummaryArgs,
): Promise<ApplicationUnderwritingSummaryResult> {
  const appId = typeof args?.application_id === "string" ? args.application_id.trim() : "";
  if (!appId) return { ok: false, error: "application_id_required" };
  try {
    const r = await callBFServer<ApplicationUnderwritingSummaryResult>("/api/maya/staff/underwriting-summary", {
      method: "POST",
      body: { application_id: appId, session_id: typeof args?.session_id === "string" ? args.session_id : undefined },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "underwriting_summary_failed" };
  }
}

export const APPLICATION_UNDERWRITING_SUMMARY_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.underwriting_summary",
    description:
      "Read-only underwriting view of an application: document completeness, lender-match status, what's blocking funding (blockers), strengths, and a draft of the missing-document request message. Use when staff ask 'what's the status / what's blocking this deal' or to review funding readiness. Provide application_id (use the one on the current screen when they say 'this deal'). This does NOT change anything.",
    parameters: {
      type: "object",
      properties: {
        application_id: { type: "string", description: "The application to analyze." },
        session_id: { type: "string", description: "Optional session id for correlation." },
      },
      required: ["application_id"],
    },
  },
};
