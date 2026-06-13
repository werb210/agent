// MAYA_STAFF_AUDIT — review Maya's recent staff tool activity (audit trail).
import { callBFServer } from "../../integrations/bfServerClient.js";

export type MayaAuditArgs = { limit?: number; tool?: string; session_id?: string };
export type MayaAuditResult = {
  ok: boolean;
  count?: number;
  entries?: ReadonlyArray<Record<string, unknown>>;
  error?: string;
};

export async function mayaAudit(args: MayaAuditArgs): Promise<MayaAuditResult> {
  try {
    const r = await callBFServer<MayaAuditResult>("/api/maya/staff/audit-recent", {
      method: "POST",
      body: {
        limit: typeof args?.limit === "number" ? args.limit : undefined,
        tool: typeof args?.tool === "string" ? args.tool.trim() : undefined,
      },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "maya_audit_failed" };
  }
}

export const MAYA_AUDIT_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "maya.audit",
    description:
      "Review Maya's recent staff tool activity (audit trail): which tools ran, whether they succeeded, and a short result summary. Use when staff ask what Maya recently did, or to debug. Optionally filter by tool name and cap the number of entries.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Max entries to return (1-50, default 10)." },
        tool: { type: "string", description: "Optional tool name filter, e.g. 'comm.draft_email'." },
        session_id: { type: "string", description: "Optional session id for correlation." },
      },
      required: [],
    },
  },
};
