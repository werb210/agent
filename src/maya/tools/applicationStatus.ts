// AGENT_BLOCK_v3_CLIENT_TOOLS_v1
// Client-audience tool. Reports the applicant's BF application
// status, stage, document progress, and (if a PGI handoff was
// performed by BF-Server v213) whether a BI completion flow is
// available. Backed by GET /api/applications/:id (extended in
// BF-Server v216 to surface bi_* columns).
import { fetchApplicationStatus } from "../../integrations/bfServerClient.js";

export type ApplicationStatusArgs = {
  application_id: string;
};

export type ApplicationStatusResult = {
  ok: boolean;
  application_id?: string;
  name?: string | null;
  pipeline_state?: string | null;
  status?: string | null;
  requested_amount?: number | null;
  documents_total?: number;
  documents_complete?: number;
  pgi_handoff?: {
    available: boolean;
    completion_url?: string | null;
    bi_public_id?: string | null;
  };
  summary?: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function num(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  return null;
}

function countDocs(docs: unknown): { total: number; complete: number } {
  if (!Array.isArray(docs)) return { total: 0, complete: 0 };
  let total = 0;
  let complete = 0;
  for (const d of docs) {
    if (!d || typeof d !== "object") continue;
    total += 1;
    const status = String((d as any).status ?? "").toLowerCase();
    if (status === "accepted" || status === "uploaded" || status === "complete") {
      complete += 1;
    }
  }
  return { total, complete };
}

export async function applicationStatus(args: ApplicationStatusArgs): Promise<ApplicationStatusResult> {
  const applicationId = s(args?.application_id);
  if (!applicationId) {
    return { ok: false, summary: "application_id is required." };
  }
  try {
    const r: any = await fetchApplicationStatus(applicationId);
    if (!r || typeof r !== "object") {
      return { ok: false, summary: "Application not found." };
    }
    const docs = countDocs(r.documents);
    const completionUrl = s(r.bi_completion_url);
    const biPublicId = s(r.bi_public_id);
    const pgiAvailable = !!completionUrl;
    const stage = s(r.pipeline_state) ?? s(r.current_stage);
    const reqAmount = num(r.requested_amount);
    const summary = pgiAvailable
      ? `You're at "${stage ?? "in progress"}". Documents: ${docs.complete}/${docs.total}. Your PGI application is ready — complete it at the link to add the remaining underwriting details.`
      : `You're at "${stage ?? "in progress"}". Documents: ${docs.complete}/${docs.total}.`;
    return {
      ok: true,
      application_id: applicationId,
      name: s(r.name),
      pipeline_state: stage,
      status: s(r.status),
      requested_amount: reqAmount,
      documents_total: docs.total,
      documents_complete: docs.complete,
      pgi_handoff: {
        available: pgiAvailable,
        completion_url: completionUrl,
        bi_public_id: biPublicId,
      },
      summary,
    };
  } catch (e: any) {
    return { ok: false, summary: `application_status_failed: ${e?.message ?? "unknown"}` };
  }
}

export const APPLICATION_STATUS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.my_status",
    description:
      "Look up the status of the authenticated applicant's BF loan application. Returns the current stage, document progress, requested amount, and whether a PGI (insurance) completion flow is available. Use this when the applicant asks 'what's the status', 'where am I in the process', 'how much longer', or anything about their application progress.",
    parameters: {
      type: "object",
      properties: {
        application_id: {
          type: "string",
          description: "The BF application UUID. The host environment supplies this from the authenticated session.",
        },
      },
      required: ["application_id"],
    },
  },
};
