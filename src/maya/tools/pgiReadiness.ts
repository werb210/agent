// MAYA_STAFF_PGI_READINESS — read-only: PGI (Boreal Insurance) document
// status + carrier-submission readiness for a deal. Forwards to BF-Server,
// which proxies to BI-Server (the Insurance-silo data owner). Read-only.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type PgiReadinessArgs = {
  application_id?: string;
  bi_public_id?: string;
  session_id?: string;
};
export type PgiReadinessResult = { ok: boolean; result?: Record<string, unknown>; error?: string };

function s(v: unknown): string | undefined {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length ? t : undefined;
}

export async function pgiReadiness(args: PgiReadinessArgs): Promise<PgiReadinessResult> {
  const appId = s(args?.application_id);
  const biPublicId = s(args?.bi_public_id);
  if (!appId && !biPublicId) return { ok: false, error: "application_id_or_bi_public_id_required" };
  try {
    const r = await callBFServer<PgiReadinessResult>("/api/maya/staff/pgi-readiness", {
      method: "POST",
      body: {
        application_id: appId,
        bi_public_id: biPublicId,
        session_id: s(args?.session_id),
      },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "pgi_readiness_failed" };
  }
}

export const PGI_READINESS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "pgi.readiness",
    description:
      "Read-only PGI / Boreal Insurance readiness for a deal: which required PGI documents are uploaded, accepted, pending staff review, rejected, or missing (the 5 always-required — loan_agreement, profit_loss, balance_sheet, ar_aging, ap_aging — plus founder_cv and financial_forecast for startups under 3 years), and whether the application is ready to submit to the PGI carrier or has already been submitted. Use when staff ask about the Insurance silo: 'is this PGI app ready for the carrier', 'what PGI docs are still missing', 'has this been sent to the carrier yet'. Provide the application_id on the current screen (a BF deal id or a BI public id), or bi_public_id directly. This does NOT change anything or submit anything.",
    parameters: {
      type: "object",
      properties: {
        application_id: { type: "string", description: "BF application id, or the BI application's public id, on the current screen." },
        bi_public_id: { type: "string", description: "The BI application public id, if known directly." },
        session_id: { type: "string", description: "Optional session id for correlation." },
      },
      required: [],
    },
  },
};
