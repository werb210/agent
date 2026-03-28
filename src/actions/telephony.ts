import { apiRequest } from "../lib/api";

export const getTelephonyToken = async () => {
  return apiRequest<any>("/api/telephony/token", "GET");
};
