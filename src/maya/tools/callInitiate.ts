// MAYA_STAFF_CALL_INITIATE — resolve number + return a dial directive (live calling wired later).
import { callBFServer } from "../../integrations/bfServerClient.js";
export type CallInitiateArgs = { contact_id?: string; to?: string; session_id?: string };
export type CallInitiateResult = { ok: boolean; action?: Record<string, unknown>; to?: string; contact_id?: string | null; error?: string };
export async function callInitiate(args: CallInitiateArgs): Promise<CallInitiateResult> {
  try {
    const r = await callBFServer<{ ok: boolean; to?: string; contact_id?: string | null }>("/api/maya/staff/call-initiate", {
      method: "POST",
      body: {
        contact_id: typeof args?.contact_id === "string" ? args.contact_id : undefined,
        to: typeof args?.to === "string" ? args.to : undefined,
        session_id: typeof args?.session_id === "string" ? args.session_id : undefined,
      },
    });
    if (!r || typeof r !== "object" || !r.ok || !r.to) return { ok: false, error: "call_initiate_failed" };
    return { ok: true, to: r.to, contact_id: r.contact_id ?? null, action: { type: "dial", to: r.to, contact_id: r.contact_id ?? undefined, label: `Call ${r.to}` } };
  } catch { return { ok: false, error: "call_initiate_failed" }; }
}
export const CALL_INITIATE_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "call.initiate",
    description:
      "Start a phone call to a contact (e.g. 'call this client'). Resolves the number and returns a dial directive the portal/dialer places. Provide contact_id (preferred) or to. Use the contact on the current screen when the staff member says 'the client' / 'this contact'.",
    parameters: {
      type: "object",
      properties: {
        contact_id: { type: "string", description: "Contact id to call." },
        to: { type: "string", description: "Explicit phone number (E.164)." },
        session_id: { type: "string", description: "Optional session id." },
      },
      required: [],
    },
  },
};
