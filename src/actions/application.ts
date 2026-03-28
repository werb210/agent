import { apiRequest } from "../lib/api";

export const createLead = async (payload: any) => {
  return apiRequest<any>("/api/applications", "POST", payload);
};

export const updateStage = async (id: string, stage: string) => {
  return apiRequest<any>(`/api/crm/deals/${id}`, "PATCH", { stage });
};
