type Role = "user" | "assistant";

export type ChatTurn = { role: Role; content: string };

type Session = {
  turns: ChatTurn[];
  updatedAt: number;
};

export class SessionStore {
  private sessions = new Map<string, Session>();

  constructor(
    private readonly maxTurns: number = 16,
    private readonly ttlMs: number = 1000 * 60 * 60 * 6 // 6 hours
  ) {}

  get(sessionId: string): Session {
    const now = Date.now();
    const existing = this.sessions.get(sessionId);
    if (existing && now - existing.updatedAt <= this.ttlMs) {
      return existing;
    }
    const fresh: Session = { turns: [], updatedAt: now };
    this.sessions.set(sessionId, fresh);
    return fresh;
  }

  append(sessionId: string, turn: ChatTurn) {
    const s = this.get(sessionId);
    s.turns.push(turn);
    // Trim oldest
    if (s.turns.length > this.maxTurns) {
      s.turns = s.turns.slice(s.turns.length - this.maxTurns);
    }
    s.updatedAt = Date.now();
  }

  list() {
    const out: Record<string, { turns: number; updatedAt: number }> = {};
    for (const [k, v] of this.sessions.entries()) {
      out[k] = { turns: v.turns.length, updatedAt: v.updatedAt };
    }
    return out;
  }

  buildTranscript(sessionId: string): string {
    const s = this.get(sessionId);
    if (!s.turns.length) return "";
    return s.turns
      .map((t) => (t.role === "user" ? `User: ${t.content}` : `Maya: ${t.content}`))
      .join("\n");
  }
}
