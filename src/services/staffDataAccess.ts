import { callBFServer } from "../integrations/bfServerClient.js";

export async function getPipelineSummary() {
  return callBFServer("/api/staff/pipeline", { method: "GET" });
}

export async function getApplicationsByStatus(status: string) {
  return callBFServer(`/api/applications/status?status=${encodeURIComponent(status)}`, { method: "GET" });
}
