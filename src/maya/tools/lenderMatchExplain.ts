// MAYA_STAFF_LENDER_MATCH_EXPLAIN — read-only: which lenders matched a deal and why.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type LenderMatchExplainArgs = { application_id: string; session_id?: string };
export type LenderMatchExplainResult = { ok: boolean; result?: Record<string, unknown>; error?: string };

export async function lenderMatchExplain(args: LenderMatchExplainArgs): Promise<LenderMatchExplainResult> {
  const appId = typeof args?.application_id === "string" ? args.application_id.trim() : "";
  if (!appId) return { ok: false, error: "application_id_required" };
  try {
    const r = await callBFServer<LenderMatchExplainResult>("/api/maya/staff/lender-match-explain", {
      method: "POST",
      body: { application_id: appId, session_id: typeof args?.session_id === "string" ? args.session_id : undefined },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "lender_match_explain_failed" };
  }
}

export const LENDER_MATCH_EXPLAIN_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "lender.match_explain",
    description:
      "Read-only explanation of an application's lender matches: which lenders/products matched, their match percentage and reasoning, the inputs the engine used (amount, country, province, industry, revenue, time in business, product category), any missing inputs, and whether matches are stale. Use when staff ask 'which lenders fit this deal and why' or 'why didn't it match anyone'. Provide application_id (use the one on the current screen). This does NOT change anything.",
    parameters: {
      type: "object",
      properties: {
        application_id: { type: "string", description: "The application whose matches to explain." },
        session_id: { type: "string", description: "Optional session id for correlation." },
      },
      required: ["application_id"],
    },
  },
};
