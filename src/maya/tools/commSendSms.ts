// MAYA_STAFF_SEND_SMS — two-step SMS (draft unless approved=true).
import { callBFServer } from "../../integrations/bfServerClient.js";
export type CommSendSmsArgs = { contact_id?: string; to?: string; body: string; approved?: boolean; session_id?: string };
export type CommSendSmsResult = { ok: boolean; draft?: boolean; sent?: boolean; to?: string; body?: string; sid?: string | null; status?: string; note?: string; error?: string };
export async function commSendSms(args: CommSendSmsArgs): Promise<CommSendSmsResult> {
  const body = typeof args?.body === "string" ? args.body.trim() : "";
  if (!body) return { ok: false, error: "body_required" };
  try {
    const r = await callBFServer<CommSendSmsResult>("/api/maya/staff/send-sms", {
      method: "POST",
      body: {
        contact_id: typeof args?.contact_id === "string" ? args.contact_id : undefined,
        to: typeof args?.to === "string" ? args.to : undefined,
        body,
        approved: args?.approved === true,
        session_id: typeof args?.session_id === "string" ? args.session_id : undefined,
      },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch { return { ok: false, error: "send_sms_failed" }; }
}
export const COMM_SEND_SMS_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "comm.send_sms",
    description:
      "Send an SMS to a contact — TWO STEP. First call WITHOUT approved (or approved=false) to produce a draft; show the draft to the staff member and ask them to confirm. Only call again with approved=true after they explicitly say to send. Put the message in 'body' and the recipient in contact_id (preferred) or to.",
    parameters: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Contact id to resolve the phone number from." },
        to: { type: "string", description: "Explicit phone number (E.164), if not using contact_id." },
        body: { type: "string", description: "The SMS text." },
        approved: { type: "boolean", description: "Set true ONLY after the staff member explicitly confirms sending. Omit/false returns a draft." },
        session_id: { type: "string", description: "Optional session id." },
      },
      required: ["body"],
    },
  },
};
