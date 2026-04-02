import { api } from "../lib/api";
import { API_ROUTES } from "../contracts/api";

export const getTelephonyToken = async () => {
  return api<any>(API_ROUTES.telephony.token, { method: "GET" });
};
