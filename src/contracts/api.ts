export const API_ROUTES = {
  health: "/health",
  auth: {
    otpStart: "/api/auth/otp/start",
    otpVerify: "/api/auth/otp/verify",
  },
  application: {
    create: "/api/v1/applications",
    upload: "/api/v1/documents",
  },
  leads: {
    create: "/api/v1/crm/lead",
  },
  calls: {
    start: "/api/v1/call/start",
    status: "/api/v1/call/status",
  },
  maya: {
    message: "/api/v1/maya/message",
  },
  telephony: {
    token: "/api/v1/telephony/token",
  },
  dialer: {
    token: "/api/v1/dialer/token",
  },
  crm: {
    deal: (id: string) => `/api/v1/crm/deals/${id}`,
  },
} as const;
