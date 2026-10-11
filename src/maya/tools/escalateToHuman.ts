// AGENT_BLOCK_v115_ESCALATE_TO_HUMAN_v1
// Presence-aware handoff. Checks staff availability via BF-Server
// /api/telephony/presence; routes the resulting handoff into
// BF-Server's /api/communications/maya-handoff (which writes to
// maya_escalations + communications_messages AND fans Twilio SMS).
// recipients='available' when at least one staffer is available,
// 'fallback' otherwise (operator's MAYA_FALLBACK_SMS_NUMBERS env
// covers Andrew + Todd after-hours).
import { callBFServer } from "../../integrations/bfServerClient.js";
import { getAvailableStaff } from "../../services/staffAvailability.js";

// AGENT_BLOCK_v328_ESCALATE_PHONE_PASSTHROUGH_v1
export type EscalateToHumanArgs = {
  summary?: string;
  surface?: string;
  silo?: string;
  session_id?: string;
  phone?: string;
  email?: string;
  application_id?: string;
  contact_id?: string;
  /** AGENT_v789_HANDOFF_IDENTITY - details a visitor typed; unverified, for a person to read. */
  provided_contact?: { name: string | null; phone: string | null; email: string | null } | null;
};

export type EscalateToHumanResult = {
  ok: boolean;
  mode: "live" | "after_hours";
  attempted_recipients: number;
  delivered: number;
  summary: string;
};

export async function escalateToHuman(args: EscalateToHumanArgs): Promise<EscalateToHumanResult> {
  const summary = typeof args?.summary === "string" ? args.summary.slice(0, 1000) : null;
  const surface = typeof args?.surface === "string" ? args.surface.slice(0, 50) : "website";
  const silo = typeof args?.silo === "string" ? args.silo.slice(0, 10) : "BF";
  const sessionId = typeof args?.session_id === "string" ? args.session_id : null;
  // AGENT_BLOCK_v328_ESCALATE_PHONE_PASSTHROUGH_v1 — pass identifying hints
  // so BF-Server resolves the contact and surfaces the handoff in the
  // Messages-tab list against the right person.
  const phone = typeof args?.phone === "string" ? args.phone : null;
  const email = typeof args?.email === "string" ? args.email : null;
  const applicationId = typeof args?.application_id === "string" ? args.application_id : null;
  const contactId = typeof args?.contact_id === "string" ? args.contact_id : null;
  // AGENT_v789_HANDOFF_IDENTITY - phone, contact_id and application_id above are injected by
  // dispatchTool from the verified X-Maya-Context only (the model cannot set them). What a
  // visitor typed goes separately as providedContact, which BF-Server must not match on.
  const pc = args?.provided_contact && typeof args.provided_contact === "object" ? args.provided_contact : null;
  const providedContact = pc && (pc.name || pc.phone || pc.email) ? { name: pc.name ?? null, phone: pc.phone ?? null, email: pc.email ?? null } : null;

  const available = await getAvailableStaff();
  const recipients = available.length > 0 ? "available" : "fallback";

  try {
    const res = await callBFServer<{ status?: string; fanout?: { attempted?: string[]; delivered?: string[] } }>(
      "/api/communications/maya-handoff",
      {
        method: "POST",
        body: {
          sessionId,
          surface,
          silo,
          summary,
          recipients,
          phone,
          email,
          applicationId,
          contactId,
          providedContact,
        },
      },
    );
    if (res && typeof res === "object" && (res as { ok?: unknown }).ok === false) throw new Error("handoff_refused");
    const attempted = Array.isArray(res?.fanout?.attempted) ? res.fanout!.attempted!.length : 0;
    const delivered = Array.isArray(res?.fanout?.delivered) ? res.fanout!.delivered!.length : 0;
    return {
      ok: true,
      mode: recipients === "available" ? "live" : "after_hours",
      attempted_recipients: attempted,
      delivered,
      summary:
        recipients === "available"
          ? `Notified ${delivered}/${attempted} available staff. Someone will reach out shortly.`
          : `Off-hours — sent ${delivered}/${attempted} fallback notifications. You'll hear back soon.`,
    };
  } catch (e: any) {
    return {
      ok: false,
      mode: recipients === "available" ? "live" : "after_hours",
      attempted_recipients: 0,
      delivered: 0,
      summary: `handoff_failed: ${e?.message ?? "unknown"}`,
    };
  }
}

export const ESCALATE_TO_HUMAN_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "escalate.to_human",
    description:
      "Hand the conversation off to a human. Use when the visitor says 'talk to a person', 'I want to speak with someone', clicks Talk to a Human, or you cannot answer their question. On the website, first ask for their name and a phone number or email and record them with visitor.identify, so someone can follow up. Only tell them someone will follow up when this returns ok=true. Returns mode='live' if staff are available right now, or mode='after_hours' if the message went to the on-call fallback.",
    parameters: {
      type: "object",
      properties: {
        summary: {
          type: "string",
          description: "One-sentence summary of what the visitor wanted, written for the staff member who will pick this up.",
        },
        surface: {
          type: "string",
          enum: ["website", "client", "portal"],
          description: "Which surface the visitor is on.",
        },
        silo: {
          type: "string",
          enum: ["BF", "BI", "SLF"],
          description: "Which silo this handoff belongs to. Default BF.",
        },
        // AGENT_v789_HANDOFF_IDENTITY - no phone, email, application_id or contact_id here:
        // they come from the verified session, never from the model.
      },
      required: ["summary"],
    },
  },
};
