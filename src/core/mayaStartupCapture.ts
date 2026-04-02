import { callBFServer } from "../integrations/bfServerClient";

export async function captureStartupLead(data: {
  name: string;
  email: string;
  phone: string;
}) {
  await callBFServer("/api/crm/lead",  data);
  return { success: true };
}
