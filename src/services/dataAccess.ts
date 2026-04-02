import { callBFServer } from "../integrations/bfServerClient";

export async function findApplication(identifier: string) {
  return callBFServer(`/api/applications/status?identifier=${encodeURIComponent(identifier)}`);
}

export async function getDocumentStatus(applicationId: string) {
  return callBFServer(`/api/applications/status?applicationId=${encodeURIComponent(applicationId)}`);
}

export async function getLenderProductRanges(productType: string) {
  return callBFServer(`/api/staff/pipeline?productType=${encodeURIComponent(productType)}`);
}
