import { API_ROUTES } from "./api";

export const endpoints = {
  createLead: API_ROUTES.leads.create,
  startCall: API_ROUTES.calls.start,
  updateCallStatus: API_ROUTES.calls.status,
  sendMessage: API_ROUTES.maya.message,
} as const;
