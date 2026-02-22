export type Capability =
  | "view_sessions"
  | "modify_sessions"
  | "view_marketing"
  | "modify_marketing"
  | "view_executive"
  | "ml_predict"
  | "state_transition"
  | "admin_override";

export const roleCapabilities: Record<string, Capability[]> = {
  admin: [
    "view_sessions",
    "modify_sessions",
    "view_marketing",
    "modify_marketing",
    "view_executive",
    "ml_predict",
    "state_transition",
    "admin_override"
  ],
  broker: [
    "view_sessions",
    "state_transition"
  ],
  intake: [
    "view_sessions",
    "modify_sessions"
  ],
  marketing: [
    "view_marketing",
    "modify_marketing"
  ],
  executive: [
    "view_executive"
  ],
  system: [
    "ml_predict",
    "state_transition"
  ]
};

