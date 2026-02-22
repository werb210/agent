import express from "express";
import cors from "cors";
import Twilio from "twilio";
import VoiceResponse = require("twilio/lib/twiml/VoiceResponse");
import agentRouter, { routeAgent } from "./router/agentRouter";
import mayaRouter from "./router/mayaRouter";
import multiAgentRouter from "./router/multiAgentRouter";
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
import voiceRoutes from "./routes/voiceRoutes";
import smsRoutes from "./routes/smsRoutes";
import adminAnalytics from "./routes/adminAnalytics";
import mayaPortal from "./routes/mayaPortal";
import mayaSandbox from "./routes/mayaSandbox";
import twilio from "twilio";
import { ENV } from "./infrastructure/env";
import { isProd } from "./config/env";
import { logger } from "./infrastructure/logger";
import { strategicDecision } from "./core/strategicEngine";
import { calculateBrokerScore } from "./core/brokerPerformance";
import { generateRiskHeatmap } from "./core/portfolioRisk";
import { forecast90Days } from "./core/capitalForecast";
import { capitalEfficiencyIndex } from "./core/capitalEfficiency";
import { requireCapability } from "./security/capabilityGuard";
import { featureFlags } from "./security/featureFlags";
import { mlBreaker } from "./core/mlClient";
import { recordMetric } from "./core/metricsLogger";
import { detectMLDrift } from "./core/mlDriftMonitor";
import { detectCampaignAnomaly } from "./core/campaignAnomaly";
import { apiLimiter } from "./security/rateLimit";
import { sanitizeString } from "./security/sanitizer";
import { calculateConfidence as calculateMLConfidence } from "./core/confidenceScore";

export const app = express();
const pendingVoiceActions = new Map<string, ReturnType<typeof interpretAction>>();

app.use(cors({
  origin: [
    "https://yourproductiondomain.com",
    "https://portal.yourproductiondomain.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use("/maya", apiLimiter);

app.use((req, res, next) => {
  if (process.env.NODE_ENV === "production" && req.headers["x-forwarded-proto"] !== "https") {
    return res.status(403).send("HTTPS required");
  }

  return next();
});

app.get("/", (_, res) => {
  res.json({ status: "Maya SMS Agent running" });
});

app.get("/health", async (_req, res) => {
  const errorCount = await pool.query(`
    SELECT COUNT(*) FROM maya_metrics
    WHERE metric_name='system_error'
    AND created_at > NOW() - INTERVAL '1 hour'
  `);

  res.json({
    status: "ok",
    errors_last_hour: Number(errorCount.rows[0].count),
    ml_circuit_state: mlBreaker.getState()
  });
});

app.get("/maya/health", async (_req, res) => {
  res.json({
    status: "operational",
    redis: true,
    queue: true,
    llm: true,
    timestamp: new Date()
  });
});

app.post("/maya/strategic-decision", async (req, res) => {
  try {
    const payload = req.body as {
      funding_amount?: number;
      annual_revenue?: number;
      product_type?: string;
      industry?: string;
      time_in_business?: number;
    };

    if (typeof payload.funding_amount !== "number") {
      return res.status(400).json({ error: "funding_amount is required" });
    }

    const result = await strategicDecision({
      funding_amount: payload.funding_amount,
      annual_revenue: payload.annual_revenue ?? 0,
      time_in_business: payload.time_in_business ?? 0,
      product_type: payload.product_type,
      industry: payload.industry
    });

    return res.json(result);
  } catch (err) {
    logger.error("Strategic decision error", { err });
    return res.status(500).json({ error: "Failed to compute strategic decision" });
  }
});

app.post("/maya/brokers/:brokerId/score", async (req, res) => {
  try {
    const brokerId = String(req.params.brokerId ?? "");

    if (!brokerId) {
      return res.status(400).json({ error: "brokerId is required" });
    }

    const performance = await calculateBrokerScore(brokerId);
    return res.json({ broker_id: brokerId, performance_score: performance });
  } catch (err) {
    logger.error("Broker scoring error", { err });
    return res.status(500).json({ error: "Failed to score broker" });
  }
});

app.get("/maya/executive-dashboard", async (_req, res) => {
  const simulations = await pool.query(`
    SELECT COALESCE(SUM(risk_adjusted_projection), 0) AS forecasted_revenue
    FROM maya_revenue_simulations
  `);

  const topBrokers = await pool.query(`
    SELECT broker_id, performance_score
    FROM maya_broker_scores
    ORDER BY performance_score DESC
    LIMIT 5
  `);

  res.json({
    forecasted_revenue: simulations.rows[0]?.forecasted_revenue ?? 0,
    top_brokers: topBrokers.rows
  });
});


app.get("/maya/executive-macro", async (req: any, res) => {
  const role = req.user?.role ?? req.headers["x-maya-role"];
  requireCapability(role, "view_executive");

  const forecast = await forecast90Days();
  const efficiency = await capitalEfficiencyIndex();

  res.json({
    forecast,
    efficiency,
    neural_network_active: featureFlags.enableNeuralNetwork,
    reinforcement_learning_active: featureFlags.enableReinforcementLearning
  });
});



app.get("/maya/observability", async (_req, res) => {
  const drift = await detectMLDrift();
  const anomaly = await detectCampaignAnomaly();

  const errorCount = await pool.query(`
    SELECT COUNT(*) FROM maya_metrics
    WHERE metric_name='system_error'
    AND created_at > NOW() - INTERVAL '24 hours'
  `);

  res.json({
    ml_drift_score: drift,
    campaign_anomaly: anomaly,
    system_errors_last_24h: Number(errorCount.rows[0].count)
  });
});

app.get("/maya/audit/:entityId", async (req, res) => {
  const { entityId } = req.params;

  const logs = await pool.query(
    `SELECT * FROM maya_audit_log
     WHERE entity_id=$1
     ORDER BY created_at DESC`,
    [entityId]
  );

  res.json(logs.rows);
});

app.get("/maya/intelligence", async (_req, res) => {
  const heatmap = await generateRiskHeatmap();
  const forecast = await forecast90Days();

  res.json({
    risk_heatmap: heatmap,
    capital_forecast: forecast
  });
});

async function getExplanation(sessionId: string) {
  const result = await pool.query(
    `SELECT * FROM maya_explanations
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT 1`,
    [sessionId]
  );

  return result.rows[0] || null;
}

app.get("/maya/explain/:sessionId", async (req: any, res) => {
  const role = req.user?.role ?? req.headers["x-maya-role"];
  requireCapability(role, "view_executive");

  const data = await getExplanation(req.params.sessionId);
  res.json(data || {});
});

app.get("/maya/executive-explain/:sessionId", async (req: any, res) => {
  const role = req.user?.role ?? req.headers["x-maya-role"];
  requireCapability(role, "view_executive");

  const data = await getExplanation(req.params.sessionId);

  if (!data) {
    return res.json({});
  }

  return res.json({
    probability: data.probability,
    confidence_score: calculateMLConfidence(Number(data.probability)),
    reasoning_summary: data.reasoning_summary
  });
});

app.use(agentRouter);
app.use("/maya", mayaRouter);
app.use(multiAgentRouter);
app.use(aiOperationsRoutes);
app.use("/api/admin", adminUploadRoutes);
app.use("/api", voiceRoutes);
app.use("/api", smsRoutes);
app.use("/admin", adminAnalytics);
app.use("/api", mayaPortal);

if (!isProd) {
  app.use("/api", mayaSandbox);
}

app.get("/dashboard/:sessionId", async (req, res) => {
  const session = await getSession(req.params.sessionId);
  res.json(session);
});

app.get("/admin/pipeline", async (_req, res) => {
  const result = await pool.query("SELECT data FROM sessions");
  res.json(result.rows.map((r) => r.data));
});

app.get("/lender/deals", async (req, res) => {
  const email = sanitizeString(String(req.query.email ?? ""));
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
  const message = sanitizeString(String(req.body?.message ?? ""));
  const userId = sanitizeString(String(req.body?.userId ?? "agent-intake"));
  const result = await routeAgent("chat", { message, userId });
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
  const message = sanitizeString(String(req.body?.message ?? ""));
  const userId = sanitizeString(String(req.body?.userId ?? "agent-recommend"));
  const result = await routeAgent("chat", { message, userId });
  res.json({ recommendations: result.internal });
});

app.get("/agent/dashboard/:id", async (req, res) => {
  const session = await getSession(req.params.id);
  res.json(session);
});


function validateTwilio(req: express.Request) {
  const signature = req.headers["x-twilio-signature"] as string | undefined;
  const url = `${process.env.PUBLIC_WEBHOOK_URL ?? ""}/webhooks/sms`;
  const params = req.body;

  if (!signature || !process.env.TWILIO_AUTH_TOKEN || !url) {
    return false;
  }

  return twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    url,
    params
  );
}

app.post("/webhooks/sms", async (req, res) => {
  if (!validateTwilio(req)) {
    return res.status(403).send("Invalid signature");
  }

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
    logger.error("SMS webhook error", { err });
    return res.sendStatus(500);
  }
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
    logger.error("SMS webhook error", { err });
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
    logger.error("Failed to start outbound call", { error });
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
    logger.error("Post-call processing failed", { error });
    res.sendStatus(500);
  }
});

app.use(async (err: any, _req: any, res: any, _next: any) => {
  console.error("Global error:", err?.message);
  await recordMetric("system_error", 1, { message: err.message });
  res.status(500).json({ error: "Internal error" });
});
