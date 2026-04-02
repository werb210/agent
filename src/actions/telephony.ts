import { apiFetch } from "../utils/apiClient";
import { API_ROUTES } from "../contracts/api";

export const getTelephonyToken = async () => {
  return apiFetch(API_ROUTES.telephony.token, { method: "GET" });
};
