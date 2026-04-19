import { callBFServer } from "../integrations/bfServerClient.js";

export async function captureStartupLead(data: {
  name: string;
  email: string;
  phone: string;
}) {
  await callBFServer("/api/crm/lead",  data);
  return { success: true };
}
