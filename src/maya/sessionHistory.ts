// AGENT_BLOCK_v83_MAYA_SESSION_MEMORY_v1
// Maya's chat handler was stateless: every turn it sent OpenAI only
// [system, currentUserMessage]. The visitor prompt says "ON YOUR FIRST TURN
// greet + ask for name/contact", so every turn looked like the first turn and
// she re-asked forever. The widget already sends a stable sessionId, so we
// thread history server-side here. In-memory, capped, TTL'd — best effort for
// the single-instance agent service.
type Role = "user" | "assistant";
export interface HistoryMessage { role: Role; content: string; }
interface SessionEntry { messages: HistoryMessage[]; updatedAt: number; }
const MAX_MESSAGES = 12;
const TTL_MS = 30 * 60 * 1000;
const MAX_SESSIONS = 5000;
const store = new Map<string, SessionEntry>();
function isExpired(e: SessionEntry, now: number): boolean { return now - e.updatedAt > TTL_MS; }
function evictIfNeeded(now: number): void {
  if (store.size <= MAX_SESSIONS) return;
  for (const [k, e] of store) { if (isExpired(e, now)) store.delete(k); }
  if (store.size <= MAX_SESSIONS) return;
  const ordered = [...store.entries()].sort((a, b) => a[1].updatedAt - b[1].updatedAt);
  for (const [k] of ordered) { if (store.size <= MAX_SESSIONS) break; store.delete(k); }
}
export function getSessionHistory(sessionId: string): HistoryMessage[] {
  if (!sessionId) return [];
  const e = store.get(sessionId);
  if (!e) return [];
  if (isExpired(e, Date.now())) { store.delete(sessionId); return []; }
  return e.messages.slice();
}
export function appendSessionTurn(sessionId: string, userMessage: string, assistantReply: string): void {
  if (!sessionId) return;
  const now = Date.now();
  const e = store.get(sessionId) ?? { messages: [], updatedAt: now };
  if (userMessage && userMessage.trim()) e.messages.push({ role: "user", content: userMessage });
  if (assistantReply && assistantReply.trim()) e.messages.push({ role: "assistant", content: assistantReply });
  if (e.messages.length > MAX_MESSAGES) e.messages = e.messages.slice(e.messages.length - MAX_MESSAGES);
  e.updatedAt = now;
  store.set(sessionId, e);
  evictIfNeeded(now);
}
export function _clearAllSessions(): void { store.clear(); }
