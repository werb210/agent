import { api } from "../lib/api";
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
  return api<unknown>(API_ROUTES.application.create, { method: "POST", body: payload });
};

export const updateStage = async (id: string, stage: string) => {
  return api<unknown>(API_ROUTES.crm.deal(id), { method: "PATCH", body: { stage } });
};
