export const API_ROUTES = {
  health: "/health",
  auth: {
    otpStart:  "/api/auth/otp/start",
    otpVerify: "/api/auth/otp/verify",
  },
  application: {
    create: "/api/client/applications",
    upload: "/api/client/documents/upload",
  },
  leads: {
    create: "/api/crm/web-leads",
  },
  calls: {
    start:  "/api/calls/start",
    status: "/api/calls/:id/status",
    end:    "/api/calls/:id/end",
    log:    "/api/voice/calls/log",
  },
  maya: {
    message: "/api/maya/message",
    chat:    "/api/maya/chat",
  },
  telephony: {
    token:        "/api/telephony/token",
    outboundCall: "/api/telephony/outbound-call",
  },
  dialer: {
    token: "/api/telephony/token",
  },
  crm: {
    contacts: "/api/crm/contacts",
    deal: (id: string) => `/api/crm/contacts/${id}`,
  },
} as const;
