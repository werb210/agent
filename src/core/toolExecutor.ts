import { createLead as createLeadTool, startCall } from '../tools';
import { sendSMS as sendSmsTransport } from '../integrations/twilio';
import { validateToolCall } from './validateTool';

function getAgentAuthToken(): string {
  const token = process.env.AGENT_API_TOKEN;
  if (!token) {
    throw new Error('MISSING_AUTH');
  }

  return token;
}

async function createLead(arguments_: Record<string, unknown>) {
  return createLeadTool(arguments_, getAgentAuthToken());
}

async function updateCRM(arguments_: Record<string, unknown>) {
  return {
    ok: true,
    id: arguments_.id,
    fields: arguments_.fields,
  };
}

async function scheduleAppointment(arguments_: Record<string, unknown>) {
  return startCall({ to: String(arguments_.leadId ?? '') }, getAgentAuthToken());
}

async function sendSMS(arguments_: Record<string, unknown>) {
  await sendSmsTransport(String(arguments_.to ?? ''), String(arguments_.message ?? ''));
  return { ok: true };
}

async function sendEmail(arguments_: Record<string, unknown>) {
  return {
    queued: true,
    to: arguments_.to,
    subject: arguments_.subject,
    body: arguments_.body,
  };
}

export async function executeTool(raw: unknown) {
  const tool = validateToolCall(raw);

  switch (tool.name) {
    case 'createLead':
      return await createLead(tool.arguments);
    case 'updateCRMRecord':
      return await updateCRM(tool.arguments);
    case 'scheduleAppointment':
      return await scheduleAppointment(tool.arguments);
    case 'sendSMS':
      return await sendSMS(tool.arguments);
    case 'sendEmail':
      return await sendEmail(tool.arguments);
    default:
      throw new Error(`Unknown tool: ${tool.name}`);
  }
}
