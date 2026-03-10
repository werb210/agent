import { bfServerRequest } from "../integrations/bfServerClient";

export async function executeTool(name: string, params: Record<string, unknown>) {
  switch (name) {
    case "createLead":
      return bfServerRequest("/api/crm/lead", "POST", params);
    case "scheduleAppointment":
      return bfServerRequest("/api/applications/create", "POST", params);
    case "updateCRMRecord":
      return bfServerRequest("/api/crm/contacts", "POST", params);
    case "sendSMS":
      return bfServerRequest("/api/calls/log", "POST", { type: "sms", ...params });
    case "transferCall":
      return bfServerRequest("/api/calls/log", "POST", { type: "transfer", ...params });
    default:
      throw new Error(`Unsupported tool: ${name}`);
  }
}
