// AGENT_HOTFIX_v5a_RESTORE_AUDIENCE_AND_PIPELINE_QUERY_v1
// Restored from AGENT_BLOCK_v2. Audience contract used by the
// chat handler in src/api/maya.ts (via parseAudience +
// MAYA_AUDIENCE_HEADER) and by the tool registry / dispatcher
// (via isToolAllowed). Adding a new tool means: implement it,
// register it in toolRegistry.ts, and list its name under the
// audiences allowed to call it in TOOLS_BY_AUDIENCE below.
export type MayaAudience = "visitor" | "client" | "staff";

export const MAYA_AUDIENCE_HEADER = "x-maya-audience";

export const TOOLS_BY_AUDIENCE: Readonly<Record<MayaAudience, ReadonlyArray<string>>> = {
  visitor: [
    "visitor.identify",
    "info.products",
    "info.qualifications",
    "lead.capture",
    "apply.start_url",
    "escalate.to_human",
  ],
  client: [
    "application.my_status",
    "docs.checklist",
    "pgi.completion_link",
    "book.callback",
    "escalate.to_human",
  ],
  staff: [
    "pipeline.query",
    "contact.find",
    "application.summary",
    "comm.draft_email",
    "comm.send_sms",
    "call.initiate",
    "maya.audit",
    "application.open_newest",
    "ui.navigate",
    "application.underwriting_summary",
    "lender.match_explain",
  ],
};

/**
 * Normalize an incoming X-Maya-Audience header value into a
 * MayaAudience. Unknown / missing values fall back to "visitor"
 * — the most-restricted whitelist — so legacy or anonymous
 * callers cannot accidentally pick up staff tools.
 */
export function parseAudience(raw: string | string[] | undefined): MayaAudience {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (typeof v !== "string") return "visitor";
  const norm = v.trim().toLowerCase();
  if (norm === "staff" || norm === "client" || norm === "visitor") return norm;
  return "visitor";
}

/**
 * Is a given tool name in the allowlist for the given audience?
 * Returns false for unknown tool names, by design — an unknown
 * tool is never allowed.
 */
export function isToolAllowed(audience: MayaAudience, toolName: string): boolean {
  const list = TOOLS_BY_AUDIENCE[audience];
  if (!list) return false;
  return list.includes(toolName);
}
