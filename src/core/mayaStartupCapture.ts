import { bfServerRequest } from "../integrations/bfServerClient";

export async function captureStartupLead(data: {
  name: string;
  email: string;
  phone: string;
}) {
  await bfServerRequest("/api/crm/lead", "POST", data);
  return { success: true };
}
