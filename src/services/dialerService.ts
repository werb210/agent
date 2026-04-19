import { API_ROUTES } from "../contracts/api.js";
import { apiFetch } from "../utils/apiClient.js";

export async function fetchToken() {
  return apiFetch(API_ROUTES.dialer.token, { method: "GET" });
}

export async function startCall(payload: { to: string }) {
  return apiFetch(API_ROUTES.calls.start, {
    method: "POST",
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
}

export async function sendStatus(payload: { callId: string; status: string }) {
  return apiFetch(API_ROUTES.calls.status, {
    method: "POST",
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
}
