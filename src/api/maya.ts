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

  // Minimal, reliable completion. Streaming can be layered in later.
  const systemPrompt = [
    "You are Maya, the Boreal Financial assistant.",
    "Help users understand financing options, start applications, and connect with Boreal staff.",
    "Keep answers under 120 words. If asked for data you do not have, say so and offer to hand off to a human.",
  ].join(" ");

  const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.3,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error("[maya] OpenAI error", upstream.status, errText);
    res.status(502).json({
      reply: null,
      error: "openai_upstream_failed",
      upstreamStatus: upstream.status,
      detail: errText.slice(0, 300),
    });
    return;
  }

  const data = await upstream.json();
  const reply = data?.choices?.[0]?.message?.content?.toString().trim() ||
    "Thanks — a Boreal advisor will reach out.";

  res.status(200).json({ reply, actions: [] });
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
    await postToBFServer("/api/chat/escalate", {
      reason: reason ?? "user_requested_human",
      sessionId,
      applicationId,
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
    await postToBFServer("/api/issues", {
      message,
      screenshotBase64: screenshotBase64 ?? null,
      applicationId: applicationId ?? null,
      sessionId: sessionId ?? null,
      source: "client_maya",
    });
    persisted = true;
  } catch (error) {
    console.warn("[maya] BF persist failed", error);
  }
  res.status(200).json({ ok: true, persisted });
}));

// Read-only data access for Maya internal tools (not directly callable by the widget).
mayaRouter.get("/maya/internal/applications/:id", safeHandler(async (req, res) => {
  const data = await getFromBFServer(`/api/applications/${req.params.id}`);
  res.status(200).json(data);
}));
mayaRouter.get("/maya/internal/contacts", safeHandler(async (_req, res) => {
  const data = await getFromBFServer(`/api/crm/contacts`);
  res.status(200).json(data);
}));
mayaRouter.get("/maya/internal/lender-products", safeHandler(async (_req, res) => {
  const data = await getFromBFServer(`/api/client/lender-products`);
  res.status(200).json(data);
}));
