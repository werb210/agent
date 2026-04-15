import { triggerOutboundCall } from "../twilioService";
import { callBFServer } from "../../integrations/bfServerClient";

export async function autoOutboundHighValueLeads() {
  const contactResponse = await callBFServer<any>("/api/crm/contacts");
  const contacts = Array.isArray(contactResponse)
    ? contactResponse
    : Array.isArray(contactResponse?.contacts)
      ? contactResponse.contacts
      : Array.isArray(contactResponse?.rows)
        ? contactResponse.rows
        : [];

  const leads = contacts.filter((lead: any) => Number(lead?.deal_value ?? 0) > 250000);

  for (const lead of leads) {
    if (!lead?.phone) continue;
    await triggerOutboundCall(lead.phone);
    await callBFServer("/api/calls/log", {
      leadId: lead.id,
      phone: lead.phone,
      status: "contacted",
      source: "auto_outbound_high_value_leads",
    });
  }
}
