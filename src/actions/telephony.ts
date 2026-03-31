import { bfServerRequest } from "../integrations/bfServerClient";

export const getTelephonyToken = async () => {
  return bfServerRequest("/api/telephony/token", "GET");
};
