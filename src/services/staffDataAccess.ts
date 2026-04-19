import { callBFServer } from "../integrations/bfServerClient.js";

export async function getPipelineSummary() {
  return callBFServer("/api/staff/pipeline");
}

export async function getApplicationsByStatus(status: string) {
  return callBFServer(`/api/applications/status?status=${encodeURIComponent(status)}`);
}
