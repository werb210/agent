import { endpoints } from "../contracts/endpoints";

export const ENDPOINTS = {
  dialerToken: "/dialer/token",
  callStart: endpoints.startCall,
  voiceStatus: endpoints.updateCallStatus,
};
