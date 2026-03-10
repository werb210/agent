import { bfServerRequest } from "../integrations/bfServerClient";

export async function getPipelineSummary() {
  return bfServerRequest("/api/staff/pipeline", "GET");
}

export async function getApplicationsByStatus(status: string) {
  return bfServerRequest(`/api/applications/status?status=${encodeURIComponent(status)}`, "GET");
}
