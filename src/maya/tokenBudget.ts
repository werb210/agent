// AGENT_v789_TOKEN_BUDGET - in-memory daily OpenAI token budgets (replaces the unused
// infrastructure/llmCostTracker.ts, which wrote to a database the agent does not have).
//   - global: MAYA_DAILY_TOKEN_BUDGET tokens per UTC day (default 2,000,000)
//   - per session: 100,000 tokens per UTC day
// Past either budget Maya answers with a polite fallback instead of calling OpenAI.

export const DEFAULT_DAILY_TOKEN_BUDGET = 2_000_000;
export const SESSION_DAILY_TOKEN_BUDGET = 100_000;
const MAX_TRACKED_SESSIONS = 20_000;

let day = "";
let globalUsed = 0;
const perSession = new Map<string, number>();

function today(now: number): string {
  return new Date(now).toISOString().slice(0, 10);
}

function roll(now: number): void {
  const d = today(now);
  if (d !== day) {
    day = d;
    globalUsed = 0;
    perSession.clear();
  }
}

export function dailyTokenBudget(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.MAYA_DAILY_TOKEN_BUDGET);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_DAILY_TOKEN_BUDGET;
}

export type BudgetCheck = { ok: true } | { ok: false; scope: "global" | "session" };

export function checkBudget(sessionKey: string, now: number = Date.now()): BudgetCheck {
  roll(now);
  if (globalUsed >= dailyTokenBudget()) return { ok: false, scope: "global" };
  if (sessionKey && (perSession.get(sessionKey) ?? 0) >= SESSION_DAILY_TOKEN_BUDGET) return { ok: false, scope: "session" };
  return { ok: true };
}

export function recordUsage(sessionKey: string, tokens: number, now: number = Date.now()): void {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  roll(now);
  globalUsed += tokens;
  if (!sessionKey) return;
  if (!perSession.has(sessionKey) && perSession.size >= MAX_TRACKED_SESSIONS) {
    const oldest = perSession.keys().next().value;
    if (oldest !== undefined) perSession.delete(oldest);
  }
  perSession.set(sessionKey, (perSession.get(sessionKey) ?? 0) + tokens);
}

/** Tokens a completion used: usage.total_tokens, or a rough estimate from the request size. */
export function tokensUsed(response: unknown, requestBody: unknown): number {
  const total = (response as { usage?: { total_tokens?: unknown } } | null)?.usage?.total_tokens;
  if (typeof total === "number" && Number.isFinite(total)) return total;
  return Math.ceil(JSON.stringify(requestBody ?? "").length / 4) + 800;
}

export function _resetTokenBudgets(): void {
  day = "";
  globalUsed = 0;
  perSession.clear();
}
