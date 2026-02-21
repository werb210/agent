import express from "express";
import cors from "cors";
import Twilio from "twilio";
import agentRouter, { routeAgent } from "./router/agentRouter";
import mayaRouter from "./router/mayaRouter";
import { getSession } from "./memory/sessionStore";
import { getLenderPortalDeals, uploadTermSheet } from "./engine/lenderDealEngine";
import { pool } from "./config/pool";
import { generateCreditMemo } from "./engine/memoEngine";
import { generateDealPDF } from "./engine/pdfEngine";
import { extractTextFromDocument } from "./engine/ocrEngine";

const app = express();

app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ status: "Maya SMS Agent running" });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(agentRouter);
app.use("/maya", mayaRouter);

app.get("/dashboard/:sessionId", async (req, res) => {
  const session = await getSession(req.params.sessionId);
  res.json(session);
});

app.get("/admin/pipeline", async (_req, res) => {
  const result = await pool.query("SELECT data FROM sessions");
  res.json(result.rows.map((r) => r.data));
});

app.get("/lender/deals", async (req, res) => {
  const email = String(req.query.email ?? "");
  if (!email) {
    return res.status(400).json({ error: "email is required" });
  }

  const deals = await getLenderPortalDeals(email);
  return res.json({ deals });
});

app.post("/lender/deals/:id/term-sheet", async (req, res) => {
  const lenderDealId = Number(req.params.id);
  const fileUrl = String(req.body?.fileUrl ?? "");

  if (!lenderDealId || !fileUrl) {
    return res.status(400).json({ error: "lender deal id and fileUrl are required" });
  }

  const uploaded = await uploadTermSheet(lenderDealId, fileUrl);
  return res.json({ success: true, uploaded });
});

app.post("/agent/intake", async (req, res) => {
  const { message, userId } = req.body;
  const result = await routeAgent("chat", { message, userId: userId ?? "agent-intake" });
  res.json(result);
});

app.post("/agent/memo", async (req, res) => {
  const { sessionId } = req.body;
  const session = await getSession(String(sessionId));
  const memo = await generateCreditMemo(session.structured ?? {});
  res.json({ memo });
});



app.post("/agent/ocr", async (req, res) => {
  const { filePath } = req.body;
  if (!filePath) {
    return res.status(400).json({ error: "filePath is required" });
  }

  const text = await extractTextFromDocument(String(filePath));
  return res.json({ text });
});

app.post("/agent/deal-pack", async (req, res) => {
  const { sessionId } = req.body;
  const resolvedSessionId = String(sessionId);
  const session = await getSession(resolvedSessionId);
  const filePath = `./deal-pack-${resolvedSessionId}.pdf`;
  generateDealPDF(session, filePath);
  res.json({ filePath });
});

app.post("/agent/recommend", async (req, res) => {
  const { message, userId } = req.body;
  const result = await routeAgent("chat", { message, userId: userId ?? "agent-recommend" });
  res.json({ recommendations: result.internal });
});

app.get("/agent/dashboard/:id", async (req, res) => {
  const session = await getSession(req.params.id);
  res.json(session);
});

app.post("/sms", async (req, res) => {
  try {
    const incomingMessage = req.body?.Body;
    const from = req.body?.From;

    if (!incomingMessage || !from) {
      return res.sendStatus(400);
    }

    const result = await routeAgent("chat", {
      message: incomingMessage,
      userId: from
    });

    const twiml = new Twilio.twiml.MessagingResponse();
    twiml.message(result?.content ?? "No response generated.");

    res.type("text/xml");
    return res.send(twiml.toString());
  } catch (err) {
    console.error("SMS webhook error:", err);
    return res.sendStatus(500);
  }
});

app.post("/voice", async (_req, res) => {
  const response = new Twilio.twiml.VoiceResponse();
  response.say("Hi. I can help you get business funding. What amount are you looking for?");
  response.gather({
    input: ["speech"],
    action: "/voice-process",
    method: "POST"
  });
  res.type("text/xml").send(response.toString());
});

app.post("/voice-process", async (req, res) => {
  const speech = String(req.body?.SpeechResult ?? "");
  const callSid = String(req.body?.CallSid ?? `voice-${Date.now()}`);

  const result = await routeAgent("chat", {
    message: speech,
    userId: callSid
  });

  const response = new Twilio.twiml.VoiceResponse();
  response.say(result.content ?? "Thank you. Our funding team will follow up shortly.");
  response.gather({
    input: ["speech"],
    action: "/voice-process",
    method: "POST"
  });

  res.type("text/xml").send(response.toString());
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Maya SMS Agent running on port ${PORT}`);
});
