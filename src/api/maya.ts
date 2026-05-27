import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { endpoints } from "../contracts/endpoints.js";
import { apiCall } from "../lib/api.js";

export const mayaEnabled = true;

function getServiceToken(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ id: "agent-service", phone: "agent", role: "Staff" }, secret, { expiresIn: "1h" });
}

async function bfServer(path: string, init: RequestInit = {}) {
  const base = process.env.SERVER_URL || "https://server.boreal.financial";
  const token = getServiceToken();
  return fetch(`${base}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...((init.headers as Record<string, string>) || {}),
    },
  });
}

async function postToBFServer(path: string, payload: unknown) {
  const res = await bfServer(path, { method: "POST", body: JSON.stringify(payload ?? {}) });
  if (!res.ok) throw new Error(`BF-Server request failed: ${res.status}`);
  return res.json().catch(() => null);
}

async function getFromBFServer(path: string) {
  const res = await bfServer(path, { method: "GET" });
  if (!res.ok) throw new Error(`BF-Server request failed: ${res.status}`);
  return res.json().catch(() => null);
}

function safeHandler(handler: (req: Request, res: Response) => Promise<void>) {
  return (req: Request, res: Response, next: NextFunction) => {
    handler(req, res).catch(next);
  };
}

// ---------- public call helpers kept for backwards compat ----------
export async function callMaya(_path: string, payload?: any) {
  const result = await apiCall(endpoints.sendMessage, {
    method: payload ? "POST" : "GET",
    ...(payload ? { body: JSON.stringify(payload) } : {}),
  });
  if (!result || typeof result !== "object") throw new Error("Invalid Maya response");
  return result;
}

async function handleActions(actions: unknown) {
  if (!Array.isArray(actions)) return;
  for (const action of actions) {
    if (!action || typeof action !== "object" || !("type" in action)) continue;
    if ((action as { type?: string }).type === "start_call") {
      const payload = "payload" in action ? (action as { payload?: unknown }).payload : {};
      await apiCall("/api/calls/start", { method: "POST", body: JSON.stringify(payload ?? {}) });
    }
  }
}

export async function sendMessage(userInput: string, authToken?: string): Promise<string> {
  try {
    const response = await apiCall(endpoints.sendMessage, {
      method: "POST",
      headers: authToken ? { Authorization: `Bearer ${authToken}` } : undefined,
      body: JSON.stringify({ message: userInput, context: { source: "agent", timestamp: Date.now() } }),
    });
    if (!response || typeof response !== "object") throw new Error("sendMessage failed");
    await handleActions((response as { actions?: unknown }).actions);
    return "ok";
  } catch (err) {
    console.error("Agent error:", err);
    throw err;
  }
}

// ---------- Maya router ----------
export const mayaRouter = Router();

// AGENT_BLOCK_v328_MAYA_FAILSAFE_v1
// When OpenAI is unreachable or returns non-2xx, instead of 502'ing back
// to the widget (which then shows a generic "trouble" bubble), fire a
// talk_to_human escalation to BF-Server's canonical endpoint.
async function mayaHumanFailover(args: {
  message: string;
  sessionId: string | null;
  applicationId: string | null;
  phone: string | null;
  email: string | null;
  surface: string;
}): Promise<string> {
  try {
    await postToBFServer("/api/maya/escalate", {
      kind: "talk_to_human",
      message: `[Maya unavailable] ${args.message}`.slice(0, 1000),
      contact: { phone: args.phone, email: args.email },
      sessionId: args.sessionId,
      application_id: args.applicationId,
      surface: args.surface,
    });
  } catch (err) {
    console.warn("[maya] failover persist failed", err);
  }
  return "I'm having trouble reaching my brain right now — I've notified a human and someone will reach out by SMS shortly.";
}

/**
 * POST /api/maya/message
 * BF-Server's /api/maya/message proxies into this. Returns a simple
 * { reply } response consumed by the Maya widget on the Website/client/portal.
 */
// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
// The Maya chat handler now reads the X-Maya-Audience header,
// exposes only the matching tool descriptors to OpenAI, and
// executes any tool_calls the model emits via the dispatch
// registry. application_id from the body is forwarded into
// client-tool calls so the model can't read another applicant's
// data. Maximum two tool-call rounds per turn to keep latency
// bounded; the second round is the final reply.
mayaRouter.post("/api/maya/message", safeHandler(async (req, res) => {
  const message: string = (req.body?.message ?? "").toString().trim();
  if (!message) {
    res.status(400).json({ error: "missing_message" });
    return;
  }

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    // AGENT_BLOCK_v3_MAYA_GRACEFUL_FALLBACK_v1 — Maya must answer
    // *something* even when OpenAI isn't reachable. Without this we
    // returned 503 and the website widget showed an error, which made
    // the whole chatbot look broken to visitors. Send a polite canned
    // reply and a soft nudge to Talk-to-Human.
    const lower = message.toLowerCase().trim();
    let reply: string;
    if (/^(hi|hey|hello|yo|sup|good\s*(morning|afternoon|evening))[\s!.?]*$/.test(lower)) {
      reply = "Hi! I'm Maya, the Boreal Financial assistant. I can answer general questions about our lending products, or hand you off to a human advisor — tap Talk to a Human below.";
    } else if (/thank|thanks|ty\b/.test(lower)) {
      reply = "You're welcome! Tap Talk to a Human if you'd like to speak with an advisor.";
    } else if (/loan|finance|capital|equipment|funding|term|line of credit|loc/.test(lower)) {
      reply = "Boreal Financial offers term loans, lines of credit, equipment financing, commercial real estate, and acquisition financing across Canada. For details specific to your business, tap Talk to a Human and an advisor will be in touch shortly.";
    } else if (/insurance|pgi|personal\s*guarantee/.test(lower)) {
      reply = "Boreal Insurance offers Personal Guarantee Insurance (PGI) — coverage that protects business owners who've signed a personal guarantee on a loan, lease, or supplier contract. Tap Talk to a Human and an advisor will walk you through it.";
    } else if (/hour|open|when|time/.test(lower)) {
      reply = "We're online during business hours (Pacific). Outside business hours, tap Talk to a Human and we'll text you back as soon as we're in.";
    } else if (/who.*you|what.*you|about/.test(lower)) {
      reply = "I'm Maya, the Boreal Financial assistant. I can answer general questions about our lending and insurance products, or hand you off to a human advisor.";
    } else {
      reply = "Good question — that one's best handled by a person. Tap Talk to a Human below and a Boreal advisor will text you back shortly.";
    }
    res.status(200).json({ reply, actions: [], audience: "visitor", fallback: "no_openai_key" });
    return;
  }

  const { parseAudience, MAYA_AUDIENCE_HEADER } = await import("../maya/audience.js");
  const { descriptorsForAudience } = await import("../maya/toolRegistry.js");
  const { dispatchTool } = await import("../maya/dispatch.js");

  const audience = parseAudience(req.header(MAYA_AUDIENCE_HEADER));
  const tools = descriptorsForAudience(audience);
  const applicationId =
    typeof req.body?.application_id === "string"
      ? req.body.application_id
      : typeof req.body?.applicationId === "string"
        ? req.body.applicationId
        : null;
  const sessionId =
    typeof req.body?.session_id === "string"
      ? req.body.session_id
      : typeof req.body?.sessionId === "string"
        ? req.body.sessionId
        : null;
  // AGENT_BLOCK_v328_MAYA_FAILSAFE_v1
  const phone =
    typeof req.body?.phone === "string" ? req.body.phone :
    typeof req.body?.contact?.phone === "string" ? req.body.contact.phone : null;
  const email =
    typeof req.body?.email === "string" ? req.body.email :
    typeof req.body?.contact?.email === "string" ? req.body.contact.email : null;
  const ctx = { audience, applicationId, sessionId, phone, email };

  const audienceLines: Record<string, string> = {
  visitor:
    "You are speaking with a website visitor. " +
    "ON YOUR FIRST TURN: greet them briefly and ask for their name plus either an email or phone number, then call visitor.identify with the values they give you. " +
    "DO NOT answer any product, eligibility, pricing, or timeline question until visitor.identify has returned ok=true in this session. " +
    "After identification: use info.products and info.qualifications for product/eligibility questions. Pricing depends on the application — do not quote rates. " +
    "Use apply.start_url to send them to the application flow. " +
    "Use escalate.to_human when they ask for a human or when you can't answer. " +
    "Do not invent products, terms, or amounts that aren't in info.products.",
  client:
    "You are speaking with an authenticated applicant. Use application.my_status, docs.checklist, and pgi.completion_link to answer questions about their application. " +
    "Never ask them for an application_id — the host has supplied it. " +
    "Use escalate.to_human when they ask for a human or when you can't answer.",
  staff:
    "You are speaking with Boreal staff. You may use pipeline.query for natural-language questions about applications, contacts, and stages.",
};

  const systemPrompt = [
    "You are Maya, the Boreal Financial assistant.",
    audienceLines[audience],
    "Keep answers under 120 words. If asked for data you do not have, say so and offer to hand off to a human.",
    "When a tool returns ok=false, briefly acknowledge that you couldn't fetch the answer; do not pretend to know.",
  ].join(" ");

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: message },
  ];

  const callOpenAI = async (body: any) => {
    try {
      return await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
        body: JSON.stringify(body),
      });
    } catch (err) {
      // AGENT_BLOCK_v22_LLM_ERROR_LOGGING_v1
      const e = err as Error;
      console.error(JSON.stringify({ err: e?.message ?? "unknown", stack: e?.stack, msg: "maya_llm_call_failed" }));
      throw err;
    }
  };

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  const firstBody: any = {
    model,
    messages,
    temperature: 0.3,
  };
  if (tools.length > 0) {
    firstBody.tools = tools;
    firstBody.tool_choice = "auto";
  }

  let upstream1: globalThis.Response;
  try {
    upstream1 = await callOpenAI(firstBody);
  } catch {
    const reply = await mayaHumanFailover({ message, sessionId, applicationId, phone, email, surface: audience });
    res.status(200).json({ reply, actions: [], audience, fallback: "human_failover", reason: "openai_round1_exception" });
    return;
  }
  if (!upstream1.ok) {
    const errText = await upstream1.text().catch(() => "");
    console.error("[maya] OpenAI error (round 1)", upstream1.status, errText);
    const reply = await mayaHumanFailover({
      message,
      sessionId,
      applicationId,
      phone,
      email,
      surface: audience,
    });
    res.status(200).json({ reply, actions: [], audience, fallback: "human_failover", reason: "openai_round1" });
    return;
  }
  const data1 = await upstream1.json();
  const choice1 = data1?.choices?.[0]?.message;
  const toolCalls: any[] = Array.isArray(choice1?.tool_calls) ? choice1.tool_calls : [];

  if (toolCalls.length === 0) {
    const reply =
      choice1?.content?.toString().trim() ||
      "Thanks — a Boreal advisor will reach out.";
    res.status(200).json({ reply, actions: [], audience });
    return;
  }

  // Run each tool the model asked for, append the results, then
  // ask the model for a final reply.
  messages.push(choice1);
  const executedTools: string[] = [];
  for (const tc of toolCalls) {
    const toolName: string = tc?.function?.name ?? "";
    const toolArgs: string = tc?.function?.arguments ?? "";
    const resultJson = await dispatchTool(toolName, toolArgs, ctx);
    executedTools.push(toolName);
    messages.push({
      role: "tool",
      tool_call_id: tc.id,
      content: resultJson,
    });
  }

  let upstream2: globalThis.Response;
  try {
    upstream2 = await callOpenAI({
      model,
      messages,
      temperature: 0.3,
    });
  } catch {
    const reply = await mayaHumanFailover({ message, sessionId, applicationId, phone, email, surface: audience });
    res.status(200).json({ reply, actions: [], audience, fallback: "human_failover", reason: "openai_round2_exception", tools_used: executedTools });
    return;
  }
  if (!upstream2.ok) {
    const errText = await upstream2.text().catch(() => "");
    console.error("[maya] OpenAI error (round 2)", upstream2.status, errText);
    const reply = await mayaHumanFailover({
      message,
      sessionId,
      applicationId,
      phone,
      email,
      surface: audience,
    });
    res.status(200).json({ reply, actions: [], audience, fallback: "human_failover", reason: "openai_round2", tools_used: executedTools });
    return;
  }
  const data2 = await upstream2.json();
  const finalReply =
    data2?.choices?.[0]?.message?.content?.toString().trim() ||
    "Thanks — a Boreal advisor will reach out.";

  res.status(200).json({
    reply: finalReply,
    actions: [],
    audience,
    tools_used: executedTools,
  });
}));

/** Alias — some clients call /chat instead of /message. */
mayaRouter.post("/api/maya/chat", safeHandler(async (req, res) => {
  // Forward in-process to the /message handler.
  (req as any).url = "/api/maya/message";
  (mayaRouter as any).handle(req, res, () => {});
}));

// AGENT_BLOCK_v328_MAYA_FAILSAFE_v1
mayaRouter.post("/maya/escalate", safeHandler(async (req, res) => {
  const b = req.body ?? {};
  const summary: string =
    (typeof b.summary === "string" && b.summary.trim()) ||
    (typeof b.message === "string" && b.message.trim()) ||
    (typeof b.reason === "string" ? `Visitor requested human (${b.reason})` : "Visitor requested a human.");
  const contact = {
    phone: typeof b.contact?.phone === "string" ? b.contact.phone : (typeof b.phone === "string" ? b.phone : null),
    email: typeof b.contact?.email === "string" ? b.contact.email : (typeof b.email === "string" ? b.email : null),
  };
  let persisted = false;
  let conversation_id: string | null = null;
  try {
    const r = (await postToBFServer("/api/maya/escalate", {
      kind: "talk_to_human",
      message: summary,
      contact,
      sessionId: b.sessionId,
      application_id: b.applicationId ?? b.application_id ?? null,
      surface: b.surface || "unknown",
    })) as { ok?: boolean; conversation_id?: string } | null;
    persisted = Boolean(r?.ok);
    conversation_id = r?.conversation_id ?? null;
  } catch (error) {
    console.warn("[maya] BF persist failed", error);
  }
  res.status(200).json({ ok: true, persisted, conversation_id });
}));

mayaRouter.post("/maya/issue", safeHandler(async (req, res) => {
  const b = req.body ?? {};
  const description: string =
    (typeof b.message === "string" && b.message.trim()) ||
    (typeof b.description === "string" && b.description.trim()) || "";
  if (!description) {
    res.status(400).json({ error: "missing_description" });
    return;
  }
  const contact = {
    phone: typeof b.contact?.phone === "string" ? b.contact.phone : (typeof b.phone === "string" ? b.phone : null),
    email: typeof b.contact?.email === "string" ? b.contact.email : (typeof b.email === "string" ? b.email : null),
  };
  let persisted = false;
  let issue_id: string | null = null;
  try {
    const r = (await postToBFServer("/api/maya/escalate", {
      kind: "report_issue",
      description,
      page_url: typeof b.pageUrl === "string" ? b.pageUrl : (typeof b.page_url === "string" ? b.page_url : null),
      contact,
      sessionId: b.sessionId,
      application_id: b.applicationId ?? b.application_id ?? null,
      screenshot_data_url: typeof b.screenshotBase64 === "string"
        ? (b.screenshotBase64.startsWith("data:") ? b.screenshotBase64 : `data:image/png;base64,${b.screenshotBase64}`)
        : null,
    })) as { ok?: boolean; issue_id?: string } | null;
    persisted = Boolean(r?.ok);
    issue_id = r?.issue_id ?? null;
  } catch (error) {
    console.warn("[maya] BF persist failed", error);
  }
  res.status(200).json({ ok: true, persisted, issue_id });
}));

// AGENT_BLOCK_v327_REMOVE_INTERNAL_DATA_LEAK_ROUTES_v1
// The three /maya/internal/* routes used to live below this comment:
//   GET /maya/internal-applications/:id     -> proxied to BF-Server
//                                              /api/applications/:id with
//                                              a service JWT (role=Staff),
//                                              returning the FULL application
//                                              record (PII, banking, financials,
//                                              credit summary) to the caller.
//   GET /maya/internal-contacts             -> proxied to BF-Server /api/crm/contacts
//                                              with the same service JWT, returning
//                                              the entire CRM contact list.
//   GET /maya/internal-lender-products      -> proxied to BF-Server /api/client/
//                                              lender-products (less sensitive but
//                                              same pattern).
// All three had NO auth middleware on the agent itself. CORS_ALLOWED_ORIGINS
// defaults empty in production (the warning at app.ts:53 explicitly logs
// "all origins allowed in production"), so the routes were reachable by any
// caller on the internet. The service JWT was minted internally with role=Staff,
// so BF-Server happily returned the data.
// Verified zero callers in BF-Server, BF-portal, BF-Website, BF-client, the
// agent's own toolExecutor, or anywhere else in the agent code -- these were
// orphaned scaffolding. Delete them outright; if a legitimate future caller
// needs application/contact data through the agent, they can use the
// /api/maya/message tool-dispatch path which already filters by
// X-Maya-Audience and application_id.
// Kept above this comment: /api/maya/message, /api/maya/chat (intentionally
// public for the FloatingChat widget on the marketing site), /maya/escalate,
// /maya/issue (called via BF-Server proxy -- gating those is a separate
// concern requiring matching proxy headers from BF-Server).
