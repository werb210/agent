// MAYA_STAFF_APPLICATION_SUMMARY — one-shot deal summary for the staff copilot.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type ApplicationSummaryArgs = { application_id?: string; name?: string; session_id?: string };
export type ApplicationSummaryResult = {
  ok: boolean;
  summary?: Record<string, unknown>;
  error?: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function applicationSummary(args: ApplicationSummaryArgs): Promise<ApplicationSummaryResult> {
  // AGENT_MAYA_FACTS_v371 - staff ask by business name or short id ("details on BIBUSA", "#61AE").
  const appId = s(args?.application_id);
  const name = s(args?.name);
  if (!appId && !name) return { ok: false, error: "application_id_or_name_required" };
  try {
    const r = await callBFServer<ApplicationSummaryResult>("/api/maya/staff/application-summary", {
      method: "POST",
      body: { application_id: appId ?? undefined, name: appId ? undefined : name, session_id: s(args?.session_id) ?? undefined },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "application_summary_failed" };
  }
}

export const APPLICATION_SUMMARY_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.summary",
    description:
      "Summarize a single application/deal for staff: current stage and status, requested amount and product, the applicant (name/email/phone/company), required-document progress (accepted vs missing), last activity, and a suggested next action. Also returns the product category, currency, days in stage, the lenders the file was sent to and any offers. Pass application_id, or name (a business name or short id such as BIBUSA or 61AE) when you do not have the id.",
    parameters: {
      type: "object",
      properties: {
        application_id: { type: "string", description: "The application UUID to summarize." },
        name: { type: "string", description: "Business name or short id, when the UUID is not known." },
        session_id: { type: "string", description: "Optional session id for audit/correlation." },
      },
      required: [],
    },
  },
};
