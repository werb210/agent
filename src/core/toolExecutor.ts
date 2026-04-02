import { createLead as createLeadTool, startCall } from "../tools";
import { sendSMS as sendSmsTransport } from "../integrations/twilio";
import { MayaToolCall } from "../types/tool";

function getAgentAuthToken(): string {
  const token = process.env.AGENT_API_TOKEN;
  if (!token) {
    throw new Error("MISSING_AUTH");
  }

  return token;
}

async function createLead(payload: MayaToolCall<"createLead">["payload"]) {
  return createLeadTool(payload, getAgentAuthToken());
}

async function updateCRMRecord(payload: MayaToolCall<"updateCRMRecord">["payload"]) {
  return {
    ok: true,
    id: payload.id,
    fields: payload.fields
  };
}

async function scheduleAppointment(payload: MayaToolCall<"scheduleAppointment">["payload"]) {
  return startCall({ to: payload.leadId }, getAgentAuthToken());
}

async function sendSMS(payload: MayaToolCall<"sendSMS">["payload"]) {
  await sendSmsTransport(payload.to, payload.message);
  return { ok: true };
}

async function sendEmail(payload: MayaToolCall<"sendEmail">["payload"]) {
  return { queued: true, to: payload.to, subject: payload.subject, body: payload.body };
}

export async function executeTool(call: MayaToolCall) {
  switch (call.name) {
    case "createLead":
      return createLead(call.payload as MayaToolCall<"createLead">["payload"]);
    case "updateCRMRecord":
      return updateCRMRecord(call.payload as MayaToolCall<"updateCRMRecord">["payload"]);
    case "scheduleAppointment":
      return scheduleAppointment(call.payload as MayaToolCall<"scheduleAppointment">["payload"]);
    case "sendSMS":
      return sendSMS(call.payload as MayaToolCall<"sendSMS">["payload"]);
    case "sendEmail":
      return sendEmail(call.payload as MayaToolCall<"sendEmail">["payload"]);
    default:
      throw new Error(`Unknown tool: ${(call as { name?: string }).name}`);
  }
}
