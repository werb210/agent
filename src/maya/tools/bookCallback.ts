// MAYA_CLIENT_BOOK_CALLBACK — log a callback request via the escalate sink.
import { callBFServer } from "../../integrations/bfServerClient.js";
export type BookCallbackArgs = { preferred_time?: string; reason?: string; phone?: string; email?: string; application_id?: string; session_id?: string };
export type BookCallbackResult = { ok: boolean; persisted?: boolean; error?: string };
export async function bookCallback(args: BookCallbackArgs): Promise<BookCallbackResult> {
  const time = typeof args?.preferred_time === "string" ? args.preferred_time.trim() : "";
  const reason = typeof args?.reason === "string" ? args.reason.trim() : "";
  const msg = `Callback requested${time ? ` for ${time}` : ""}${reason ? ` — ${reason}` : ""}.`;
  try {
    const r = await callBFServer<{ ok?: boolean; persisted?: boolean }>("/api/maya/escalate", {
      method: "POST",
      body: {
        kind: "callback_request",
        message: msg,
        contact: { phone: typeof args?.phone === "string" ? args.phone : null, email: typeof args?.email === "string" ? args.email : null },
        application_id: typeof args?.application_id === "string" ? args.application_id : null,
        sessionId: typeof args?.session_id === "string" ? args.session_id : null,
        surface: "client",
      },
    });
    return { ok: true, persisted: Boolean(r?.persisted ?? r?.ok) };
  } catch { return { ok: false, error: "book_callback_failed" }; }
}
export const BOOK_CALLBACK_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "book.callback",
    description:
      "Log a request for a Boreal advisor to call the client back. Use when the client asks for a callback or to be contacted by phone. Capture an optional preferred time and reason; the applicant's phone/email and application are attached automatically when known.",
    parameters: {
      type: "object",
      properties: {
        preferred_time: { type: "string", description: "When they'd like the call, e.g. 'tomorrow afternoon'." },
        reason: { type: "string", description: "Short reason/topic for the callback." },
        phone: { type: "string" },
        email: { type: "string" },
        application_id: { type: "string" },
        session_id: { type: "string" },
      },
      required: [],
    },
  },
};
