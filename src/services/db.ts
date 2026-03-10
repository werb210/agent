import { bfServerRequest } from "../integrations/bfServerClient";

export const db = {
  async getApplicationById(applicationId: string, userId: string) {
    return bfServerRequest(`/api/applications/status?applicationId=${encodeURIComponent(applicationId)}&userId=${encodeURIComponent(userId)}`, "GET");
  }
};
