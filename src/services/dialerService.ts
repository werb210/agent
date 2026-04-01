import { ENDPOINTS } from "../config/endpoints";
import { apiRequest } from "../lib/apiClient";

export async function fetchToken() {
  return apiRequest(ENDPOINTS.dialerToken);
}

export async function startCall(payload: { to: string }) {
  return apiRequest(ENDPOINTS.callStart, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendStatus(payload: { callId: string; status: string }) {
  return apiRequest(ENDPOINTS.voiceStatus, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
