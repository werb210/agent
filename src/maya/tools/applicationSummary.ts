// MAYA_STAFF_APPLICATION_SUMMARY — one-shot deal summary for the staff copilot.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type ApplicationSummaryArgs = { application_id: string; session_id?: string };
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
  const appId = s(args?.application_id);
  if (!appId) return { ok: false, error: "application_id_required" };
  try {
    const r = await callBFServer<ApplicationSummaryResult>("/api/maya/staff/application-summary", {
      method: "POST",
      body: { application_id: appId, session_id: s(args?.session_id) ?? undefined },
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
      "Summarize a single application/deal for staff: current stage and status, requested amount and product, the applicant (name/email/phone/company), required-document progress (accepted vs missing), last activity, and a suggested next action. Requires the application's id — use contact.find or pipeline.query first if you only have a name.",
    parameters: {
      type: "object",
      properties: {
        application_id: { type: "string", description: "The application UUID to summarize." },
        session_id: { type: "string", description: "Optional session id for audit/correlation." },
      },
      required: ["application_id"],
    },
  },
};
