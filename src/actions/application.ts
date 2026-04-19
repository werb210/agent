import { apiFetch } from "../utils/apiClient.js";
import { API_ROUTES } from "../contracts/api.js";

type CreateLeadPayload = {
  name: string;
  email?: string;
  phone: string;
  businessName?: string;
  productType?: string;
  message?: string;
};

export const createLead = async (payload: CreateLeadPayload) => {
  return apiFetch(API_ROUTES.application.create, { method: "POST", body: JSON.stringify(payload) });
};

export const updateStage = async (id: string, stage: string) => {
  return apiFetch(API_ROUTES.crm.deal(id), { method: "PATCH", body: JSON.stringify({ stage }) });
};
