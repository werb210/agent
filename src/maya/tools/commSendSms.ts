// MAYA_STAFF_SEND_SMS - AGENT_v784_SMS_DRAFT_ONLY: the tool only creates a draft on BF-Server.
// The staff member sends it by pressing Send in the Maya panel; the model can never send.
import { callBFServer } from "../../integrations/bfServerClient.js";
export const SMS_DRAFT_REPLY = "Draft ready - press Send in the Maya panel to send it. It has NOT been sent.";
export type CommSendSmsArgs = { contact_id?: string; to?: string; body: string; session_id?: string; staff_user_id?: string };
export type CommSendSmsResult = { ok: boolean; pending?: boolean; pendingId?: string; preview?: unknown; message?: string; error?: string };
type DraftResponse = { pending?: unknown; pendingId?: unknown; preview?: unknown; error?: unknown };
export async function commSendSms(args: CommSendSmsArgs): Promise<CommSendSmsResult> {
  const body = typeof args?.body === "string" ? args.body.trim() : "";
  if (!body) return { ok: false, error: "body_required" };
  const staffUserId = typeof args?.staff_user_id === "string" && args.staff_user_id ? args.staff_user_id : null;
  if (!staffUserId) return { ok: false, error: "staff_identity_required" };
  try {
    const r = await callBFServer<DraftResponse>("/api/maya/staff/send-sms", {
      method: "POST",
      body: {
        contact_id: typeof args?.contact_id === "string" ? args.contact_id : undefined,
        to: typeof args?.to === "string" ? args.to : undefined,
        body,
        staff_user_id: staffUserId,
        session_id: typeof args?.session_id === "string" ? args.session_id : undefined,
      },
    });
    if (!r || typeof r !== "object" || r.pending !== true) {
      const error = r && typeof r === "object" && typeof r.error === "string" ? r.error : "sms_draft_failed";
      return { ok: false, error, message: "The SMS draft could not be created. Nothing was sent." };
    }
    return {
      ok: true,
      pending: true,
      pendingId: typeof r.pendingId === "string" ? r.pendingId : undefined,
      preview: r.preview,
      message: SMS_DRAFT_REPLY,
    };
  } catch {
    return { ok: false, error: "sms_draft_failed", message: "The SMS draft could not be created. Nothing was sent." };
  }
}
export const COMM_SEND_SMS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "comm.send_sms",
    description:
      "Prepare an SMS to a contact as a DRAFT. This never sends: the staff member must press Send in the Maya panel. After calling it, reply exactly: \"" + SMS_DRAFT_REPLY + "\" If it fails, say the draft could not be created. Put the message in 'body' and the recipient in contact_id (preferred) or to.",
    parameters: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Contact id to resolve the phone number from." },
        to: { type: "string", description: "Explicit phone number (E.164), if not using contact_id." },
        body: { type: "string", description: "The SMS text." },
        session_id: { type: "string", description: "Optional session id." },
      },
      required: ["body"],
    },
  },
};
