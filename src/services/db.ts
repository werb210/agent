import { callBFServer } from "../integrations/bfServerClient";

export const db = {
  async getApplicationById(applicationId: string, userId: string) {
    return callBFServer(`/api/applications/status?applicationId=${encodeURIComponent(applicationId)}&userId=${encodeURIComponent(userId)}`);
  }
};
