import { API_ROUTES } from "../contracts/api";
import { api } from "../lib/api";

export async function fetchToken() {
  return api(API_ROUTES.dialer.token, { method: "GET" });
}

export async function startCall(payload: { to: string }) {
  return api(API_ROUTES.calls.start, {
    method: "POST",
    ...(payload ? { body: payload } : {}),
  });
}

export async function sendStatus(payload: { callId: string; status: string }) {
  return api(API_ROUTES.calls.status, {
    method: "POST",
    ...(payload ? { body: payload } : {}),
  });
}
