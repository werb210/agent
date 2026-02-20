const sessions: Record<string, any> = {};

export function getSession(sessionId: string) {
  if (!sessions[sessionId]) {
    sessions[sessionId] = {
      conversation: [],
      structured: {},
      scoring: null,
      tier: null,
      product: null,
      lenderMatches: null,
      hotLead: false
    };
  }
  return sessions[sessionId];
}

export function updateSession(sessionId: string, updates: any) {
  const session = getSession(sessionId);
  Object.assign(session, updates);
}
