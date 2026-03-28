import api from "../lib/api";

type ApiEnvelope<T> = {
  success: boolean;
  error?: string;
  data: T;
};

export const createLead = async (payload: any) => {
  const { data: response } = await api.post<ApiEnvelope<any>>("/api/applications", payload);

  if (!response.success) {
    throw new Error(response.error || "Failed to create lead");
  }

  return response.data;
};

export const updateStage = async (id: string, stage: string) => {
  const { data: response } = await api.patch<ApiEnvelope<any>>(`/api/crm/deals/${id}`, { stage });

  if (!response.success) {
    throw new Error(response.error || "Failed to update stage");
  }

  return response.data;
};
