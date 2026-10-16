// AGENT_BLOCK_v83_MAYA_SESSION_MEMORY_v1
// AGENT_v789_SESSION_KEY - callers pass sessionKey(audience, subject, sessionId), never a raw session id.
type Role = "user" | "assistant";
export interface HistoryMessage { role: Role; content: string; }
interface SessionEntry { messages: HistoryMessage[]; updatedAt: number; }
// AGENT_v789_LIMITS - the model sees at most the last 20 history entries.
export const MAX_HISTORY_MESSAGES = 20;
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
export function getSessionHistory(key: string): HistoryMessage[] {
  if (!key) return [];
  const e = store.get(key);
  if (!e) return [];
  if (isExpired(e, Date.now())) { store.delete(key); return []; }
  return e.messages.slice(-MAX_HISTORY_MESSAGES);
}
// MAYA_v817 - each stored entry is capped too, so what one turn resends stays bounded (20 entries x 2,000 chars)
// and a long conversation is not cut off by its own history.
export const MAX_HISTORY_ENTRY_CHARS = 2_000;
export function appendSessionTurn(key: string, userMessage: string, assistantReply: string): void {
  if (!key) return;
  userMessage = typeof userMessage === "string" ? userMessage.slice(0, MAX_HISTORY_ENTRY_CHARS) : "";
  assistantReply = typeof assistantReply === "string" ? assistantReply.slice(0, MAX_HISTORY_ENTRY_CHARS) : "";
  const now = Date.now();
  const e = store.get(key) ?? { messages: [], updatedAt: now };
  if (userMessage && userMessage.trim()) e.messages.push({ role: "user", content: userMessage });
  if (assistantReply && assistantReply.trim()) e.messages.push({ role: "assistant", content: assistantReply });
  if (e.messages.length > MAX_HISTORY_MESSAGES) e.messages = e.messages.slice(e.messages.length - MAX_HISTORY_MESSAGES);
  e.updatedAt = now;
  store.set(key, e);
  evictIfNeeded(now);
}
export function _clearAllSessions(): void { store.clear(); }
