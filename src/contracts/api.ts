export const API_ROUTES = {
  health: "/health",
  auth: {
    otpStart: "/auth/otp/start",
    otpVerify: "/auth/otp/verify",
  },
  application: {
    create: "/applications",
    upload: "/documents",
  },
  leads: {
    create: "/leads",
  },
  calls: {
    start: "/calls/start",
    status: "/calls/status",
  },
  maya: {
    message: "/maya/message",
  },
  telephony: {
    token: "/telephony/token",
  },
  dialer: {
    token: "/dialer/token",
  },
  crm: {
    deal: (id: string) => `/crm/deals/${id}`,
  },
} as const;
