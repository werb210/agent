import type { MayaRequest, MayaResponse } from "../../types/maya.js";
import { callBFServer } from "../../integrations/bfServerClient.js";

export async function handleMarketingMode(body: MayaRequest): Promise<MayaResponse> {
  const query = (body.message ?? "").toLowerCase();

  if (query.includes("lead") || query.includes("crm")) {
    try {
      const contacts = await callBFServer<any[]>("/api/crm/contacts");
      const count = Array.isArray(contacts) ? contacts.length : 0;
      return {
        reply: `There are currently ${count} contacts in the CRM. Would you like to know about recent leads or campaign performance?`,
        confidence: 0.75,
        escalated: false,
      };
    } catch {
      return { reply: "Unable to retrieve CRM data right now.", confidence: 0.3, escalated: false };
    }
  }

  return {
    reply: "I can help with marketing insights, lead data, and campaign performance. What would you like to know?",
    confidence: 0.6,
    escalated: false,
  };
}
