import { apiFetch } from "../utils/apiClient.js";
import { API_ROUTES } from "../contracts/api.js";

export const getTelephonyToken = async () => {
  return apiFetch(API_ROUTES.telephony.token, { method: "GET" });
};
