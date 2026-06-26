import { Router, type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { getSessionHistory, appendSessionTurn } from "../maya/sessionHistory.js";
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

const CLIENT_APP_URL = process.env.CLIENT_URL || "https://client.boreal.financial";

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
  const rawTools = descriptorsForAudience(audience);
  // v82: OpenAI requires tool function names to match ^[a-zA-Z0-9_-]+$.
  // Maya's names use dots (e.g. "lead.capture"), which 400 the request. Send
  // sanitized names to the API; keep a reverse map so dispatchTool still gets
  // the original (dotted) name. Reversible even for names with underscores,
  // because the map is keyed on the exact sanitized string.
  const toolNameMap = new Map<string, string>();
  const tools = rawTools.map((t: any) => {
    const orig: string = t?.function?.name ?? "";
    const safe = orig.replace(/[^a-zA-Z0-9_-]/g, "_");
    if (safe !== orig) toolNameMap.set(safe, orig);
    return safe === orig ? t : { ...t, function: { ...t.function, name: safe } };
  });
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

  const sharedPersona =
    "You are Maya, Boreal Financial's assistant — knowledgeable, warm, and genuinely helpful. You are the expert guide to Boreal's financing: you know the products, the lenders, and how it all works. " +
    "For ANY product, eligibility, or pricing question, use lender.products together with info.products and info.qualifications, and answer accurately from real data. " +
    "When asked about interest rates, give a RANGE across matching products (e.g. 'our term loans generally run between X% and Y%') and explain the actual rate depends on factors like credit, time in business, revenue, and the specific lender — never quote a single guaranteed rate. " +
    "Use apply.start_url to send someone into the application flow. Use escalate.to_human when they ask for a person or you genuinely cannot help. " +
    "Do not invent products, terms, amounts, or rates. Keep it natural and conversational — never mention tools, audiences, verification tiers, or any internal system.";
  const audienceLines: Record<string, string> = {
    visitor:
      sharedPersona +
      " You are speaking with someone on Boreal's public website, and you do NOT have a verified identity for them. Answer all general questions — products, rates as ranges, qualifications, how things work — fully and warmly, and encourage them to start an application; reassure them they can begin now and add documents later. " +
      "ACCOUNT PRIVACY (critical): for anything tied to a specific person's account — their application status, documents, what's missing, next steps, offers, amounts, or even whether a phone number matches an existing client — you must NOT look it up or reveal anything, because they are not verified. Instead, warmly direct them to verify: say you can pull that up securely once they confirm it's them, and give them this link to open the secure client app and verify with a quick code: " + CLIENT_APP_URL + " . Never confirm or deny whether their details match a client on file. " +
      "If they give a name, you may greet them by first name and keep helping with general questions, but still gate every account-specific detail behind verification.",
    client:
      sharedPersona +
      " You are inside the secure client app with a verified, signed-in client. You may freely discuss their own application status, documents, what's missing, next steps, and offers. Use application.my_status, application.find_mine, docs.checklist, application.next_step, signature.status, and pgi.completion_link as needed. Be supportive and practical; reassure them they can start now and upload documents later — missing documents never block beginning or continuing an application.",
    staff:
      "You are speaking with Boreal staff inside the internal portal. Be terse and operational. " +
      "Use pipeline.query for natural-language questions about applications, contacts, and stages; contact.find to resolve a person; application.summary to summarize a deal; and comm.draft_email to draft an email for staff approval (never sent automatically). " +
      "For navigation/command requests, use application.open_newest (e.g. 'open the newest application') or ui.navigate to open a specific contact, company, application, or section the staff member names or is currently viewing. Use maya.audit to review recent Maya activity. " +
      "When you take a navigation action, keep the spoken reply short (one line confirming what you opened).",
  };

  const screenContext =
    req.body?.screen_context && typeof req.body.screen_context === "object" && !Array.isArray(req.body.screen_context)
      ? (req.body.screen_context as Record<string, unknown>)
      : null;

  // MAYA_FOUNDATION_SURFACE_SILO_v1 — Maya must always know WHO it is talking
  // to (audience), on WHICH surface (website / client app / staff portal), and
  // for staff WHICH silo (BF/BI/SLF). Surface defaults from audience; the
  // frontends may override via screen_context.surface / .silo. Silo defaults to
  // BF for staff until the portal passes its SiloContext explicitly.
  const SURFACE_BY_AUDIENCE: Record<string, string> = {
    visitor: "the public Boreal website",
    client: "the secure client application app",
    staff: "the internal staff portal",
  };
  const ctxSurface =
    (screenContext && typeof screenContext.surface === "string" && screenContext.surface.trim()) ||
    (typeof req.body?.surface === "string" && req.body.surface.trim()) ||
    SURFACE_BY_AUDIENCE[audience] ||
    "an unknown surface";
  const ctxSilo =
    (screenContext && typeof screenContext.silo === "string" && screenContext.silo.trim()) ||
    (typeof req.body?.silo === "string" && req.body.silo.trim()) ||
    (audience === "staff" ? "BF" : "");
  const whoWhereLine =
    audience === "staff"
      ? `You are speaking with a Boreal staff member on ${ctxSurface}${ctxSilo ? ` in the ${ctxSilo} silo` : ""}. Keep your answers scoped to that silo's data and never expose one silo's records in another.`
      : audience === "client"
        ? `You are speaking with a signed-in Boreal client on ${ctxSurface}.`
        : `You are speaking with a prospective customer (a visitor) on ${ctxSurface}.`;

  const screenContextLine = screenContext
    ? audience === "staff"
      ? `The staff member is currently viewing this screen (JSON): ${JSON.stringify(screenContext)}. When they say "this", "current", "it", "the contact", or "the client", resolve against this screen context — e.g. pass the id shown here to ui.navigate or another tool.`
      : `The user is currently on this screen (JSON): ${JSON.stringify(screenContext)}. When they say "this", "my application", "here", or "current", resolve against it.`
    : "";
  // MAYA_IDENTITY_RECOGNITION_v1 — for a verified client surface, resolve who
  // we are speaking with from the host-supplied phone and inject it so Maya
  // greets by name and references their applications without re-asking. Strictly
  // gated to the "client" (OTP-verified) audience: never run for website visitors,
  // so a typed phone on the public site can never surface account data.
  let identityLine = "";
  if (audience === "client" && ctx.phone) {
    try {
      const res = await bfServer("/api/maya/staff/applications-by-phone", {
        method: "POST",
        body: JSON.stringify({ phone: ctx.phone, session_id: sessionId }),
      });
      if (res.ok) {
        const j: any = await res.json().catch(() => null);
        const name: string | null =
          (j && (j.contactName || j.name || j.contact?.name)) ?? null;
        const apps: any[] = Array.isArray(j?.applications) ? j.applications : [];
        if (name || apps.length) {
          const who = name ? `You are speaking with ${name}.` : "You are speaking with a returning client.";
          const count = apps.length
            ? ` They have ${apps.length} application(s) on file. Greet them by first name and reference their progress; do not re-ask who they are.`
            : " Greet them warmly by name if known.";
          identityLine = who + count;
        }
      }
    } catch {
      // best-effort recognition; never block the reply
    }
  }

  const systemPrompt = [
    "You are Maya, the Boreal Financial assistant.",
    whoWhereLine,
    audienceLines[audience],
    identityLine,
    screenContextLine,
    "Keep answers under 120 words. If asked for data you do not have, say so and offer to hand off to a human.",
    "When a tool returns ok=false, briefly acknowledge that you couldn't fetch the answer; do not pretend to know.",
  ].filter(Boolean).join(" ");

  const priorHistory = sessionId ? getSessionHistory(sessionId) : [];

  // MAYA_TRAINING_RETRIEVAL — pull trained knowledge + tuned persona from
  // BF-Server and prepend as a system message. Best-effort: a failure here
  // must never block the reply, so every call is guarded and degrades to "".
  let mayaAugment = "";
  try {
    const [ksRes, ppRes] = await Promise.all([
      bfServer("/api/maya/knowledge-search", { method: "POST", body: JSON.stringify({ query: message }) }).catch(() => null),
      bfServer("/api/maya/maya-persona", { method: "POST", body: JSON.stringify({ audience }) }).catch(() => null),
    ]);
    let knowledge = "";
    let persona = "";
    let tone = "";
    if (ksRes && ksRes.ok) {
      const j = await ksRes.json().catch(() => null);
      if (j && typeof j.context === "string") knowledge = j.context;
    }
    if (ppRes && ppRes.ok) {
      const j = await ppRes.json().catch(() => null);
      if (j) {
        persona = typeof j.persona === "string" ? j.persona : "";
        tone = typeof j.tone === "string" ? j.tone : "";
      }
    }
    const parts: string[] = [];
    if (persona) parts.push(persona);
    if (tone) parts.push(`Tone: ${tone}.`);
    if (knowledge) parts.push(`Relevant Boreal knowledge (use it to answer accurately; do not contradict it):\n${knowledge}`);
    mayaAugment = parts.join("\n\n");
  } catch {
    // best-effort augmentation; ignore failures
  }

  const messages: any[] = [
    { role: "system", content: systemPrompt },
    ...(mayaAugment ? [{ role: "system", content: mayaAugment }] : []),
    ...priorHistory,
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
    if (sessionId) appendSessionTurn(sessionId, message, reply);
    res.status(200).json({ reply, actions: [], audience });
    return;
  }

  // Run each tool the model asked for, append the results, then
  // ask the model for a final reply.
  messages.push(choice1);
  const executedTools: string[] = [];
  const collectedActions: any[] = [];
  for (const tc of toolCalls) {
    const rawToolName: string = tc?.function?.name ?? "";
    const toolName: string = toolNameMap.get(rawToolName) ?? rawToolName;
    const toolArgs: string = tc?.function?.arguments ?? "";
    const resultJson = await dispatchTool(toolName, toolArgs, ctx);
    executedTools.push(toolName);
    try {
      const parsed = JSON.parse(resultJson);
      if (parsed && typeof parsed === "object" && parsed.action && typeof parsed.action === "object") {
        collectedActions.push(parsed.action);
      }
    } catch {
      // non-JSON tool result — no action to collect
    }
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

  if (sessionId) appendSessionTurn(sessionId, message, finalReply);
  res.status(200).json({
    reply: finalReply,
    actions: collectedActions,
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
