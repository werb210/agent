import { triggerOutboundCall } from "../twilioService.js";
import { logDecision } from "../complianceLogger.js";
import { callBFServer } from "../../integrations/bfServerClient.js";

export async function runOutboundCampaign(campaignId: string) {
  const contactsResponse = await callBFServer<any>("/api/crm/contacts");
  const contacts = Array.isArray(contactsResponse)
    ? contactsResponse
    : Array.isArray(contactsResponse?.contacts)
      ? contactsResponse.contacts
      : Array.isArray(contactsResponse?.rows)
        ? contactsResponse.rows
        : [];

  const leads = contacts
    .filter((lead: any) => lead?.campaign_id === campaignId || lead?.campaignId === campaignId)
    .slice(0, 25);

  for (const lead of leads) {
    if (!lead?.phone) continue;

    await triggerOutboundCall(lead.phone);

    await callBFServer("/api/calls/log", {
      campaignId,
      leadId: lead.id,
      phone: lead.phone,
      status: "called",
    });

    await logDecision(
      "outbound_call",
      { phone: lead.phone, campaignId },
      { status: "called" },
      "Outbound call triggered by Admin campaign upload"
    );
  }

  return leads.length;
}
