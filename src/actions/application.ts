import { apiRequest } from "../lib/api";
import { API_ROUTES } from "../contracts/api";

type CreateLeadPayload = {
  name: string;
  email?: string;
  phone: string;
  businessName?: string;
  productType?: string;
  message?: string;
};

export const createLead = async (payload: CreateLeadPayload) => {
  return apiRequest<unknown>(API_ROUTES.application.create, "POST", payload);
};

export const updateStage = async (id: string, stage: string) => {
  return apiRequest<unknown>(API_ROUTES.crm.deal(id), "PATCH", { stage });
};
