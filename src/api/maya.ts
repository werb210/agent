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
    res.status(503).json({
      reply: null,
      error: "openai_not_configured",
      message: "Set OPENAI_API_KEY on the agent service.",
    });
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
  const ctx = { audience, applicationId, sessionId };

  const audienceLines: Record<string, string> = {
    visitor:
      "You are speaking with a website visitor. Use info.* tools to answer marketing questions, lead.capture only when the visitor volunteers contact info or asks to be contacted, apply.start_url to hand off to the application flow.",
    client:
      "You are speaking with an authenticated applicant. Use application.my_status, docs.checklist, and pgi.completion_link to answer questions about their application. Never ask them for an application_id — the host has supplied it.",
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
    return fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify(body),
    });
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

  const upstream1 = await callOpenAI(firstBody);
  if (!upstream1.ok) {
    const errText = await upstream1.text().catch(() => "");
    console.error("[maya] OpenAI error (round 1)", upstream1.status, errText);
    res.status(502).json({
      reply: null,
      error: "openai_upstream_failed",
      upstreamStatus: upstream1.status,
      detail: errText.slice(0, 300),
    });
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

  const upstream2 = await callOpenAI({
    model,
    messages,
    temperature: 0.3,
  });
  if (!upstream2.ok) {
    const errText = await upstream2.text().catch(() => "");
    console.error("[maya] OpenAI error (round 2)", upstream2.status, errText);
    res.status(502).json({
      reply: null,
      error: "openai_upstream_failed",
      upstreamStatus: upstream2.status,
      detail: errText.slice(0, 300),
    });
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

mayaRouter.post("/maya/escalate", safeHandler(async (req, res) => {
  const { reason, sessionId, applicationId } = req.body ?? {};
  let persisted = false;
  try {
    await postToBFServer("/api/maya/escalations", {
      reason: reason ?? "user_requested_human",
      sessionId,
      applicationId,
      surface: (req.body && (req.body as any).surface) || "unknown",
    });
    persisted = true;
  } catch (error) {
    console.warn("[maya] BF persist failed", error);
  }
  res.status(200).json({ ok: true, persisted });
}));

mayaRouter.post("/maya/issue", safeHandler(async (req, res) => {
  const { message, screenshotBase64, applicationId, sessionId } = req.body ?? {};
  let persisted = false;
  try {
    await postToBFServer("/api/client/issues", {
      message,
      screenshotBase64: screenshotBase64 ?? null,
      applicationId: applicationId ?? null,
    });
    persisted = true;
  } catch (error) {
    console.warn("[maya] BF persist failed", error);
  }
  res.status(200).json({ ok: true, persisted });
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
