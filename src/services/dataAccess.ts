import { bfServerRequest } from "../integrations/bfServerClient";

export async function findApplication(identifier: string) {
  return bfServerRequest(`/api/applications/status?identifier=${encodeURIComponent(identifier)}`, "GET");
}

export async function getDocumentStatus(applicationId: string) {
  return bfServerRequest(`/api/applications/status?applicationId=${encodeURIComponent(applicationId)}`, "GET");
}

export async function getLenderProductRanges(productType: string) {
  return bfServerRequest(`/api/staff/pipeline?productType=${encodeURIComponent(productType)}`, "GET");
}
