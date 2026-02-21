import express from "express";
import cors from "cors";
import Twilio from "twilio";
import VoiceResponse = require("twilio/lib/twiml/VoiceResponse");
import agentRouter, { routeAgent } from "./router/agentRouter";
import mayaRouter from "./router/mayaRouter";
import { getSession } from "./memory/sessionStore";
import { getLenderPortalDeals, uploadTermSheet } from "./engine/lenderDealEngine";
import { pool } from "./config/pool";
import { generateCreditMemo } from "./engine/memoEngine";
import { generateDealPDF } from "./engine/pdfEngine";
import { extractTextFromDocument } from "./engine/ocrEngine";
import { interpretAction } from "./services/actionInterpreter";
import { executeAction } from "./services/actionExecutor";
import { logCall, logCallSummary } from "./services/callLogger";
import { scoreCall } from "./engine/callScoringEngine";
import { transcribeAudio, summarizeFundingCall } from "./services/openaiService";
import { sendSMS } from "./services/smsService";
import aiOperationsRoutes from "./routes/aiOperationsRoutes";
import adminUploadRoutes from "./routes/adminUploadRoutes";

const app = express();
const pendingVoiceActions = new Map<string, ReturnType<typeof interpretAction>>();

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
app.use(aiOperationsRoutes);
app.use("/api/admin", adminUploadRoutes);

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


app.post("/voice/outbound", async (req, res) => {
  try {
    const { to } = req.body ?? {};

    if (!to) {
      return res.status(400).json({ error: "to is required" });
    }

    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH || !process.env.TWILIO_NUMBER || !process.env.AGENT_URL) {
      return res.status(500).json({ error: "Twilio outbound voice env vars are not fully configured" });
    }

    const client = Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH);

    const call = await client.calls.create({
      to: String(to),
      from: process.env.TWILIO_NUMBER,
      url: `${process.env.AGENT_URL}/voice`
    });

    return res.json({ callSid: call.sid });
  } catch (error) {
    console.error("Failed to start outbound call", error);
    return res.status(500).json({ error: "Unable to initiate outbound call" });
  }
});

app.post("/voice", async (_req, res) => {
  const twiml = new VoiceResponse();

  const gather = twiml.gather({
    input: ["speech"],
    action: "/voice/process",
    speechTimeout: "auto"
  });

  gather.say(
    "Hello. This is Maya from Boreal Financial. How can I assist you today?"
  );

  res.type("text/xml");
  res.send(twiml.toString());
});

app.post("/voice/process", async (req, res) => {
  const speechResult = String(req.body?.SpeechResult ?? "").trim();
  const from = String(req.body?.From ?? req.body?.CallSid ?? `voice-${Date.now()}`);
  const twiml = new VoiceResponse();

  if (!speechResult) {
    const gather = twiml.gather({
      input: ["speech"],
      action: "/voice/process",
      speechTimeout: "auto"
    });

    gather.say("I didn't catch that. Could you repeat your request?");
    res.type("text/xml");
    return res.send(twiml.toString());
  }

  const pendingAction = pendingVoiceActions.get(from);
  const isConfirm = ["confirm", "confirmed", "yes confirm"].includes(speechResult.toLowerCase());

  if (pendingAction && isConfirm) {
    const bookingExecution = await executeAction(pendingAction, {
      mode: "client",
      sessionId: from,
      confirmed: true,
      phone: from
    });
    pendingVoiceActions.delete(from);
    twiml.say(typeof bookingExecution.message === "string"
      ? bookingExecution.message
      : "Your request has been confirmed.");
    await logCall(from, `Caller: ${speechResult}\nMaya: ${twiml.toString()}`);
    const gather = twiml.gather({
      input: ["speech"],
      action: "/voice/process",
      speechTimeout: "auto"
    });
    gather.say("Is there anything else I can help you with?");
    res.type("text/xml");
    return res.send(twiml.toString());
  }

  const result = await routeAgent("chat", {
    message: speechResult,
    userId: from
  });

  const action = interpretAction(`${speechResult} ${result?.content ?? ""}`);
  const escalated = action.type === "transfer";

  twiml.say(result?.content ?? "Thank you. A specialist will follow up shortly.");

  if (action.requiresConfirmation) {
    pendingVoiceActions.set(from, action);
    twiml.say("Please say confirm to proceed.");
  }

  if (escalated) {
    if (process.env.TRANSFER_NUMBER) {
      twiml.say(
        { voice: "alice" },
        "Whisper: High value deal. Monthly revenue above 100K."
      );

      twiml.dial({
        record: "record-from-answer",
        action: "/voice/post-call"
      }, process.env.TRANSFER_NUMBER);
    } else {
      twiml.say("A specialist will call you back shortly.");
    }
  } else {
    const gather = twiml.gather({
      input: ["speech"],
      action: "/voice/process",
      speechTimeout: "auto"
    });
    gather.say("Is there anything else I can help you with?");
  }

  await logCall(from, `Caller: ${speechResult}\nMaya: ${result?.content ?? ""}`);

  res.type("text/xml");
  res.send(twiml.toString());
});


app.post("/voice/post-call", async (req, res) => {
  try {
    const recordingUrl = String(req.body?.RecordingUrl ?? "");
    const callSid = String(req.body?.CallSid ?? "");
    const from = String(req.body?.From ?? "");

    if (!recordingUrl || !callSid) {
      return res.status(400).json({ error: "RecordingUrl and CallSid are required" });
    }

    const transcript = await transcribeAudio(recordingUrl);
    const summary = await summarizeFundingCall(transcript);
    const score = scoreCall(summary);

    await logCallSummary(callSid, summary, score);

    if (process.env.STAFF_SERVER_URL && process.env.MAYA_INTERNAL_TOKEN) {
      await fetch(`${process.env.STAFF_SERVER_URL}/api/internal/call-summary`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-maya-token": process.env.MAYA_INTERNAL_TOKEN
        },
        body: JSON.stringify({
          summary,
          score,
          callSid
        })
      });
    }

    if (from) {
      if (score < 40) {
        await sendSMS(from, "Thanks for your time today. We'll follow up with next steps shortly.");
      } else if (score <= 70) {
        await sendSMS(from, "Thanks for speaking with Maya. We will schedule a callback to continue your funding review.");
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error("Post-call processing failed", error);
    res.sendStatus(500);
  }
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Maya SMS Agent running on port ${PORT}`);
});
