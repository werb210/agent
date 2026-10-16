// AGENT_v789_TOKEN_BUDGET - in-memory daily OpenAI token budgets (replaces the unused
// infrastructure/llmCostTracker.ts, which wrote to a database the agent does not have).
//   - global: MAYA_DAILY_TOKEN_BUDGET tokens per UTC day (default 20,000,000)
//   - per session: MAYA_SESSION_DAILY_TOKEN_BUDGET tokens per UTC day (default 2,000,000)
// Past either budget Maya answers with a polite fallback instead of calling OpenAI.
// MAYA_v817 - the per-session budget was a fixed 100,000 tokens: a client was cut off after ~10 questions and
// stayed blocked for the rest of the day. It is now configurable with a 2,000,000 default (well over 250
// questions at the bounded per-turn size), and the global default rose to match so one long chat cannot use
// up the whole service's day. Both still stop runaway or abusive sessions.

export const DEFAULT_DAILY_TOKEN_BUDGET = 20_000_000; // MAYA_v817 - was 2,000,000, the same as one session's new budget
export const DEFAULT_SESSION_DAILY_TOKEN_BUDGET = 2_000_000; // MAYA_v817 - was a fixed 100,000
/** @deprecated MAYA_v817 - use sessionDailyTokenBudget(); kept for callers that read the default. */
export const SESSION_DAILY_TOKEN_BUDGET = DEFAULT_SESSION_DAILY_TOKEN_BUDGET;
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

/** MAYA_v817 - per-session daily budget from MAYA_SESSION_DAILY_TOKEN_BUDGET (default 2,000,000). */
export function sessionDailyTokenBudget(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.MAYA_SESSION_DAILY_TOKEN_BUDGET);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : DEFAULT_SESSION_DAILY_TOKEN_BUDGET;
}

export type BudgetCheck = { ok: true } | { ok: false; scope: "global" | "session" };

export function checkBudget(sessionKey: string, now: number = Date.now()): BudgetCheck {
  roll(now);
  if (globalUsed >= dailyTokenBudget()) return { ok: false, scope: "global" };
  if (sessionKey && (perSession.get(sessionKey) ?? 0) >= sessionDailyTokenBudget()) return { ok: false, scope: "session" };
  return { ok: true };
}

// MAYA_v817 - sessionTokens: what counts against the session budget (cached prompt tokens weigh less, see
// sessionTokensUsed); defaults to the full count. The global budget always counts every token.
export function recordUsage(sessionKey: string, tokens: number, now: number = Date.now(), sessionTokens: number = tokens): void {
  if (!Number.isFinite(tokens) || tokens <= 0) return;
  roll(now);
  globalUsed += tokens;
  if (!sessionKey) return;
  if (!Number.isFinite(sessionTokens) || sessionTokens < 0) sessionTokens = tokens;
  if (!perSession.has(sessionKey) && perSession.size >= MAX_TRACKED_SESSIONS) {
    const oldest = perSession.keys().next().value;
    if (oldest !== undefined) perSession.delete(oldest);
  }
  perSession.set(sessionKey, (perSession.get(sessionKey) ?? 0) + sessionTokens);
}

/** Tokens a completion used: usage.total_tokens, or a rough estimate from the request size. */
export function tokensUsed(response: unknown, requestBody: unknown): number {
  const total = (response as { usage?: { total_tokens?: unknown } } | null)?.usage?.total_tokens;
  if (typeof total === "number" && Number.isFinite(total)) return total;
  return Math.ceil(JSON.stringify(requestBody ?? "").length / 4) + 800;
}

/**
 * MAYA_v817 - tokens a completion counts against the SESSION budget. Every turn re-sends the same instructions and
 * tool list; OpenAI serves that unchanged prefix from its prompt cache (usage.prompt_tokens_details.cached_tokens)
 * at a fraction of the price, so a cached prompt token counts a quarter. Without this a long chat spent most of its
 * budget re-sending identical instructions. Fresh prompt tokens and the reply count in full.
 */
export const CACHED_PROMPT_TOKEN_WEIGHT = 0.25;
export function sessionTokensUsed(response: unknown, requestBody: unknown): number {
  const total = tokensUsed(response, requestBody);
  const cached = (response as { usage?: { prompt_tokens_details?: { cached_tokens?: unknown } } } | null)?.usage?.prompt_tokens_details?.cached_tokens;
  if (typeof cached !== "number" || !Number.isFinite(cached) || cached <= 0 || cached > total) return total;
  return Math.ceil(total - cached * (1 - CACHED_PROMPT_TOKEN_WEIGHT));
}

export function _resetTokenBudgets(): void {
  day = "";
  globalUsed = 0;
  perSession.clear();
}
