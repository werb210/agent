import { bfServerRequest } from "../integrations/bfServerClient";

export const createLead = async (payload: any) => {
  return bfServerRequest("/api/applications", "POST", payload);
};

export const updateStage = async (id: string, stage: string) => {
  return bfServerRequest(`/api/crm/deals/${id}`, "PATCH", { stage });
};
