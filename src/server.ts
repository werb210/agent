import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Twilio from "twilio";
import { routeAgent } from "./router/agentRouter";
import { SessionStore } from "./sessionStore";

const app = express();
const sessions = new SessionStore(20, 1000 * 60 * 60 * 12); // 20 turns, 12h TTL

app.use(cors());

// Twilio sends application/x-www-form-urlencoded by default for webhooks
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "maya-sms-agent" });
});

app.get("/", (_req, res) => {
  res.json({ status: "Maya SMS Agent running" });
});

// Helpful probe in browser
app.get("/sms", (_req, res) => {
  res.status(200).send("OK - Twilio webhook expects POST here.");
});

app.get("/debug/sessions", (_req, res) => {
  res.json({ sessions: sessions.list() });
});

/**
 * Direct AI test endpoint (JSON)
 */
app.post("/ai/execute", async (req, res) => {
  try {
    const { message } = req.body ?? {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing `message`" });
    }

    const result = await routeAgent("chat", { message });

    return res.json({
      success: true,
      result,
      confidence: 0.95,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? "Unknown error" });
  }
});

/**
 * Twilio SMS webhook (form-encoded POST)
 * Responds with TwiML so the reply is immediate and reliable.
 */
app.post("/sms", async (req, res) => {
  const from = (req.body?.From ?? "").toString();
  const to = (req.body?.To ?? "").toString();
  const incomingMessage = (req.body?.Body ?? "").toString();

  // Always log what we got (this is where you'll see: Incoming SMS from: +1...)
  console.log(`[sms] Incoming SMS from=${from} to=${to} body="${incomingMessage}"`);

  if (!from || !incomingMessage) {
    return res.status(400).send("Bad Request");
  }

  // Per-user session keyed by sender phone number
  const sessionId = `sms:${from}`;

  try {
    // Record user message
    sessions.append(sessionId, { role: "user", content: incomingMessage });

    // Build lightweight transcript so Maya can stay in-context per user
    const transcript = sessions.buildTranscript(sessionId);

    // IMPORTANT:
    // routeAgent currently accepts a single message. We embed session context into the message.
    const messageForAgent =
      `You are Maya, an SMS-based assistant.\n` +
      `You are chatting with a user over SMS. Keep replies concise and natural.\n` +
      `Maintain the conversation context below. If the user changes topic, follow them.\n\n` +
      `Conversation so far:\n${transcript}\n\n` +
      `Now reply to the user's latest message.`;

    const result = await routeAgent("chat", { message: messageForAgent });

    const replyText =
      (result as any)?.content?.toString()?.trim() ||
      (result as any)?.result?.toString()?.trim() ||
      "I’m here. What do you need?";

    // Record assistant reply
    sessions.append(sessionId, { role: "assistant", content: replyText });

    console.log(`[sms] Replying to=${from} chars=${replyText.length} turns=${(sessions as any).get(sessionId).turns.length}`);

    // Respond with TwiML (Twilio will deliver this as the SMS reply)
    const twiml = new Twilio.twiml.MessagingResponse();
    twiml.message(replyText);

    res.type("text/xml").status(200).send(twiml.toString());
  } catch (err: any) {
    console.error("[sms] ERROR:", err?.message ?? err);

    // Return a TwiML fallback so Twilio still replies (instead of nothing)
    const twiml = new Twilio.twiml.MessagingResponse();
    twiml.message("I hit an error. Try again in 10 seconds.");
    res.type("text/xml").status(200).send(twiml.toString());
  }
});

const PORT = Number(process.env.PORT ?? 4000);

app.listen(PORT, () => {
  console.log(`Maya SMS Agent running on port ${PORT}`);
});
