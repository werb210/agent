// AGENT_MAYA_CATALOG_v1 - catalog counts for Maya (counts only, never lender names).
// Service-JWT authed via callBFServer. BF-silo by default.
import { callBFServer } from "../../integrations/bfServerClient.js";

type Result = { ok: boolean; [k: string]: unknown };

export type CatalogSummaryArgs = { silo?: string; session_id?: string };

export async function catalogSummary(args: CatalogSummaryArgs): Promise<Result> {
  const silo = typeof args?.silo === "string" && args.silo.trim() ? args.silo.trim() : undefined;
  const sid = typeof args?.session_id === "string" ? args.session_id : undefined;
  return callBFServer<Result>("/api/maya/catalog-summary", { method: "POST", body: { silo, session_id: sid } });
}

export const CATALOG_SUMMARY_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "catalog.summary",
    description:
      "Report how many lenders and financing products Boreal currently offers, broken down by category (term loans, lines of credit, factoring, equipment financing, merchant cash advance, and more). Use whenever someone asks 'how many lenders are there', 'how many products do you have', 'what kinds of financing do you offer', 'what do you have', or any catalog-size question. Returns COUNTS ONLY and never reveals individual lender names.",
    parameters: {
      type: "object",
      properties: {
        silo: { type: "string", description: "Silo to summarize (defaults to BF)." },
        session_id: { type: "string", description: "Optional session id." },
      },
      required: [],
    },
  },
};
