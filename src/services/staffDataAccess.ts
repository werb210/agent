import { callBFServer } from "../integrations/bfServerClient";

export async function getPipelineSummary() {
  return callBFServer("/api/staff/pipeline");
}

export async function getApplicationsByStatus(status: string) {
  return callBFServer(`/api/applications/status?status=${encodeURIComponent(status)}`);
}
