// AGENT_BLOCK_v3_CLIENT_TOOLS_v1
// Client-audience tool. Returns the list of documents still
// needed on the applicant's application. Reads the same payload
// as application.my_status (single GET /api/applications/:id).
import { fetchApplicationStatus } from "../../integrations/bfServerClient.js";

export type DocsChecklistArgs = {
  application_id: string;
};

export type DocsChecklistResult = {
  ok: boolean;
  application_id?: string;
  required: ReadonlyArray<{ document_type: string; status: string | null }>;
  missing: ReadonlyArray<{ document_type: string }>;
  complete: ReadonlyArray<{ document_type: string }>;
  summary?: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

function categorize(docs: unknown) {
  const required: Array<{ document_type: string; status: string | null }> = [];
  const missing: Array<{ document_type: string }> = [];
  const complete: Array<{ document_type: string }> = [];
  if (!Array.isArray(docs)) return { required, missing, complete };
  for (const d of docs) {
    if (!d || typeof d !== "object") continue;
    const type = s((d as any).document_category) ?? s((d as any).document_type) ?? "document";
    const status = s((d as any).status);
    required.push({ document_type: type, status });
    const norm = String(status ?? "").toLowerCase();
    if (norm === "accepted" || norm === "uploaded" || norm === "complete") {
      complete.push({ document_type: type });
    } else {
      missing.push({ document_type: type });
    }
  }
  return { required, missing, complete };
}

export async function docsChecklist(args: DocsChecklistArgs): Promise<DocsChecklistResult> {
  const applicationId = s(args?.application_id);
  if (!applicationId) {
    return {
      ok: false,
      required: [],
      missing: [],
      complete: [],
      summary: "application_id is required.",
    };
  }
  try {
    const r: any = await fetchApplicationStatus(applicationId);
    if (!r || typeof r !== "object") {
      return {
        ok: false,
        required: [],
        missing: [],
        complete: [],
        summary: "Application not found.",
      };
    }
    const cat = categorize(r.documents);
    const summary = cat.missing.length
      ? `${cat.missing.length} document(s) still needed: ${cat.missing.map((m) => m.document_type).join(", ")}.`
      : `All ${cat.complete.length} document(s) on file.`;
    return {
      ok: true,
      application_id: applicationId,
      required: cat.required,
      missing: cat.missing,
      complete: cat.complete,
      summary,
    };
  } catch (e: any) {
    return {
      ok: false,
      required: [],
      missing: [],
      complete: [],
      summary: `docs_checklist_failed: ${e?.message ?? "unknown"}`,
    };
  }
}

export const DOCS_CHECKLIST_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "docs.checklist",
    description:
      "Return the document checklist for the authenticated applicant's BF loan application: which documents are required, which are missing, and which are complete. Use this when the applicant asks 'what documents do I need', 'what's left to upload', 'am I missing anything'.",
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
