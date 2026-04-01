import { apiRequest } from "../lib/api";

type CreateLeadPayload = {
  name: string;
  email?: string;
  phone: string;
  businessName?: string;
  productType?: string;
  message?: string;
};

export const createLead = async (payload: CreateLeadPayload) => {
  return apiRequest<unknown>("/api/applications", "POST", payload);
};

export const updateStage = async (id: string, stage: string) => {
  return apiRequest<unknown>(`/api/crm/deals/${id}`, "PATCH", { stage });
};
