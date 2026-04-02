import { API_ROUTES } from "../contracts/api";

export const ENDPOINTS = {
  dialerToken: API_ROUTES.dialer.token,
  callStart: API_ROUTES.calls.start,
  voiceStatus: API_ROUTES.calls.status,
} as const;
