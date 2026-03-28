import api from "../lib/api";

type ApiEnvelope<T> = {
  success: boolean;
  error?: string;
  data: T;
};

export const getTelephonyToken = async () => {
  const { data: response } = await api.get<ApiEnvelope<any>>("/api/telephony/token");

  if (!response.success) {
    throw new Error(response.error || "Failed to get telephony token");
  }

  return response.data;
};
