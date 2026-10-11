// AGENT_v789_CONTRACT_FIXTURES - the fetch fake every test gets by default. It answers the
// real BF-Server paths with the contract fixtures and FAILS on any other URL (including
// OpenAI, which a test must fake on purpose).
import { BF_SERVER_FIXTURES, REAL_BF_SERVER_PATHS } from "./fixtures/bfServer.v789.js";

export type FakeCall = { url: string; path: string; method: string; body: any; headers: Record<string, string>; signal?: AbortSignal | null };
export type FakeHandler = (call: FakeCall) => unknown | Promise<unknown>;

export class UnknownBfServerPathError extends Error {}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
}

/**
 * A fetch that only knows BF-Server. `overrides` replaces the fixture body for a path
 * (return a Response to control the status). `openai` handles api.openai.com calls.
 */
export function createBfServerFake(opts: { overrides?: Record<string, unknown | FakeHandler>; openai?: FakeHandler } = {}) {
  const calls: FakeCall[] = [];
  const fetchImpl = async (input: unknown, init: RequestInit = {}): Promise<Response> => {
    const url = String(input instanceof URL ? input.href : typeof input === "object" && input && "url" in (input as any) ? (input as any).url : input);
    const u = new URL(url);
    let body: any = undefined;
    if (typeof init.body === "string") {
      try { body = JSON.parse(init.body); } catch { body = init.body; }
    }
    const headers = Object.fromEntries(Object.entries((init.headers as Record<string, string>) ?? {}).map(([k, v]) => [k.toLowerCase(), String(v)]));
    const call: FakeCall = { url, path: u.pathname, method: String(init.method ?? "GET").toUpperCase(), body, headers, signal: init.signal ?? null };
    if (u.hostname === "api.openai.com") {
      if (!opts.openai) throw new UnknownBfServerPathError(`fetch fake: OpenAI was called but the test did not fake it (${u.pathname})`);
      calls.push(call);
      const r = await opts.openai(call);
      return r instanceof Response ? r : jsonResponse(r);
    }
    if (!REAL_BF_SERVER_PATHS.includes(u.pathname)) {
      throw new UnknownBfServerPathError(`fetch fake: ${call.method} ${u.pathname} is not a real BF-Server path`);
    }
    calls.push(call);
    const o = opts.overrides?.[u.pathname];
    const r = typeof o === "function" ? await (o as FakeHandler)(call) : o !== undefined ? o : BF_SERVER_FIXTURES[u.pathname];
    return r instanceof Response ? r : jsonResponse(r);
  };
  return { fetch: fetchImpl as unknown as typeof fetch, calls };
}

/** An OpenAI chat-completions handler that plays back scripted assistant messages. */
export function openaiScript(messages: Array<Record<string, unknown>>, usage = { total_tokens: 50 }): FakeHandler & { bodies: any[] } {
  const bodies: any[] = [];
  let i = 0;
  const h = ((call: FakeCall) => {
    bodies.push(call.body);
    const m = messages[Math.min(i, messages.length - 1)] ?? { role: "assistant", content: "ok" };
    i += 1;
    return { choices: [{ message: m }], usage };
  }) as FakeHandler & { bodies: any[] };
  h.bodies = bodies;
  return h;
}
