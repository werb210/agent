// AGENT_BLOCK_v3_CLIENT_TOOLS_v1
// Client-audience tool. If the applicant opted into PGI on Step 6
// and BF-Server v213 successfully called BI-Server's
// /applications/from-bf, the BF application row carries a
// bi_completion_url. This tool hands that URL back so Maya can
// remind the applicant where to finish the BI underwriting
// questions. If no handoff exists, the tool says so.
import { fetchApplicationStatus } from "../../integrations/bfServerClient.js";

export type PgiCompletionLinkArgs = {
  application_id: string;
};

export type PgiCompletionLinkResult = {
  ok: boolean;
  available: boolean;
  completion_url?: string | null;
  bi_public_id?: string | null;
  summary?: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function pgiCompletionLink(args: PgiCompletionLinkArgs): Promise<PgiCompletionLinkResult> {
  const applicationId = s(args?.application_id);
  if (!applicationId) {
    return { ok: false, available: false, summary: "application_id is required." };
  }
  try {
    const r: any = await fetchApplicationStatus(applicationId);
    if (!r || typeof r !== "object") {
      return { ok: false, available: false, summary: "Application not found." };
    }
    const completionUrl = s(r.bi_completion_url);
    const biPublicId = s(r.bi_public_id);
    if (!completionUrl) {
      return {
        ok: true,
        available: false,
        completion_url: null,
        bi_public_id: null,
        summary: "No PGI completion flow exists for this application. The applicant did not opt into PGI, or the BI handoff has not completed yet.",
      };
    }
    return {
      ok: true,
      available: true,
      completion_url: completionUrl,
      bi_public_id: biPublicId,
      summary: `PGI completion URL: ${completionUrl}`,
    };
  } catch (e: any) {
    return { ok: false, available: false, summary: `pgi_completion_link_failed: ${e?.message ?? "unknown"}` };
  }
}

export const PGI_COMPLETION_LINK_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "pgi.completion_link",
    description:
      "Return the URL where the applicant can finish their PGI (Personal Guarantee Insurance) application on the BI website, if one exists. Use this when the applicant asks about PGI, 'where do I add the insurance details', 'how do I finish the insurance part', 'what's the next link'.",
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
