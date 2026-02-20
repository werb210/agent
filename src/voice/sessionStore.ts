interface SessionData {
  revenue?: number;
  amount?: number;
  industry?: string;
  urgency?: string;
}

const sessionMap = new Map<string, SessionData>();

export function getSession(callSid: string) {
  if (!sessionMap.has(callSid)) {
    sessionMap.set(callSid, {});
  }

  return sessionMap.get(callSid)!;
}

export function updateSession(callSid: string, data: Partial<SessionData>) {
  const existing = getSession(callSid);
  sessionMap.set(callSid, { ...existing, ...data });
}
