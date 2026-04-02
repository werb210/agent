import { apiRequest } from "../lib/api";
import { API_ROUTES } from "../contracts/api";

export const getTelephonyToken = async () => {
  return apiRequest<any>(API_ROUTES.telephony.token, "GET");
};
