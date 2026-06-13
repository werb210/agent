// MAYA_STAFF_DRAFT_EMAIL — draft a staff email (suggest-then-approve; never sends).
import { callBFServer } from "../../integrations/bfServerClient.js";

export type CommDraftEmailArgs = {
  subject: string;
  body: string;
  to?: string;
  contact_id?: string;
  session_id?: string;
};
export type CommDraftEmailResult = {
  ok: boolean;
  draft?: { to: string; subject: string; body: string };
  status?: string;
  note?: string;
  error?: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function commDraftEmail(args: CommDraftEmailArgs): Promise<CommDraftEmailResult> {
  const subject = s(args?.subject);
  const body = s(args?.body);
  if (!subject || !body) return { ok: false, error: "subject_and_body_required" };
  try {
    const r = await callBFServer<CommDraftEmailResult>("/api/maya/staff/draft-email", {
      method: "POST",
      body: {
        subject,
        body,
        to: s(args?.to) ?? undefined,
        contact_id: s(args?.contact_id) ?? undefined,
        session_id: s(args?.session_id) ?? undefined,
      },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "draft_email_failed" };
  }
}

export const COMM_DRAFT_EMAIL_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "comm.draft_email",
    description:
      "Compose a draft email for a staff member to review and send (it is NEVER sent automatically). You write the subject and body; provide either a recipient address (to) or a contact_id to resolve the address. Returns the draft for staff approval.",
    parameters: {
      type: "object",
      properties: {
        to: { type: "string", description: "Recipient email address. Optional if contact_id is given." },
        contact_id: { type: "string", description: "CRM contact id to resolve the recipient email. Optional if 'to' is given." },
        subject: { type: "string", description: "Email subject line." },
        body: { type: "string", description: "Full email body text." },
        session_id: { type: "string", description: "Optional session id for audit/correlation." },
      },
      required: ["subject", "body"],
    },
  },
};
