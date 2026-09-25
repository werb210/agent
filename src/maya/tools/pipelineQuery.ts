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
    // AGENT_BLOCK_v491_MAYA_TRIES_BEFORE_DECLINING - a question the server does not
    // recognise came back ok:true + not_supported + supported_queries, and Maya
    // turned that into "I can't fetch that". Retry once with the closest
    // supported report; if nothing is close, say which reports she can run.
    if (r.not_supported && Array.isArray(r.supported_queries) && r.supported_queries.length) {
      const best = closestSupported(question, r.supported_queries);
      if (best) {
        try {
          const retry = await callBFServer<PipelineQueryResult>("/api/maya/staff/pipeline-query", {
            method: "POST",
            body: { question: best.label, session_id: sessionId },
          });
          if (retry && typeof retry === "object" && !retry.not_supported) {
            return { ...retry, summary: `Closest report I can run: "${best.label}". ${retry.summary ?? ""}`.trim() };
          }
        } catch { /* fall through to the list */ }
      }
      const labels = r.supported_queries.map((q) => q.label).filter(Boolean);
      return {
        ...r,
        summary: `That exact question isn't a report I can run yet. Reports I can run: ${labels.join("; ")}. Offer the closest one instead of saying you can't help.`,
      };
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

const STOP = new Set(["the", "a", "an", "of", "for", "in", "on", "to", "and", "is", "are", "what", "which", "how", "many", "show", "me", "my", "our", "all", "with", "this", "that", "list", "any", "do", "we", "have"]);
function words(t: string): string[] {
  return t.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").split(/\s+/).filter((w) => w.length > 2 && !STOP.has(w));
}
/** The supported query sharing the most meaningful words with the question (at least one). */
export function closestSupported(question: string, supported: ReadonlyArray<{ key: string; label: string }>): { key: string; label: string } | null {
  const q = new Set(words(question));
  let best: { key: string; label: string } | null = null;
  let bestScore = 0;
  for (const item of supported) {
    const score = words(`${item.label} ${item.key.replace(/_/g, " ")}`).filter((w) => q.has(w)).length;
    if (score > bestScore) { best = item; bestScore = score; }
  }
  return bestScore > 0 ? best : null;
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
