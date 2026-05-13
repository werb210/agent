// AGENT_HOTFIX_v5a_RESTORE_AUDIENCE_AND_PIPELINE_QUERY_v1
// Restored from AGENT_BLOCK_v2. The pipeline.query staff tool
// forwards a natural-language question to BF-Server's
// POST /api/maya/staff/pipeline-query endpoint (added in
// BF-Server v214). All work is server-side: BF-Server holds the
// canned-query allowlist; this tool is a thin pass-through that
// serializes the result back to the model.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type PipelineQueryArgs = {
  question: string;
  session_id?: string;
};

export type PipelineQueryResult = {
  ok: boolean;
  query?: string;
  label?: string;
  rows?: ReadonlyArray<Record<string, unknown>>;
  summary?: string;
  not_supported?: boolean;
  supported_queries?: ReadonlyArray<{ key: string; label: string }>;
  error?: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function pipelineQuery(args: PipelineQueryArgs): Promise<PipelineQueryResult> {
  const question = s(args?.question);
  if (!question) {
    return { ok: false, error: "question_required" };
  }
  const sessionId = s(args?.session_id);
  try {
    const r = await callBFServer<PipelineQueryResult>(
      "/api/maya/staff/pipeline-query",
      {
        method: "POST",
        body: { question, session_id: sessionId },
      },
    );
    if (!r || typeof r !== "object") {
      return { ok: false, error: "empty_response" };
    }
    return r;
  } catch (e: any) {
    return {
      ok: false,
      error: "pipeline_query_failed",
      summary: e?.message ?? "unknown",
    };
  }
}

export const PIPELINE_QUERY_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "pipeline.query",
    description:
      "Run a natural-language pipeline question against the BF backend. Use this for staff queries about applications, contacts, stages, approvals, submissions, and BF/BI pipeline counts (e.g. 'oldest active application', 'approvals this week', 'apps missing bank statements', 'submissions today', 'contacts touched today'). The server holds the allowlist of supported intents and will return supported_queries if the question doesn't match.",
    parameters: {
      type: "object",
      properties: {
        question: {
          type: "string",
          description: "The staff member's natural-language question.",
        },
        session_id: {
          type: "string",
          description: "Optional session id for audit/correlation.",
        },
      },
      required: ["question"],
    },
  },
};
