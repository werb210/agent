import express from "express";
import cors from "cors";
import Twilio from "twilio";
import { routeAgent } from "./router/agentRouter";

const app = express();

/**
 * IMPORTANT:
 * Twilio sends application/x-www-form-urlencoded
 * This MUST be enabled before routes.
 */
app.use(cors());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

app.get("/", (_, res) => {
  res.json({ status: "Maya SMS Agent running" });
});

/**
 * Direct AI test endpoint
 */
app.post("/ai/execute", async (req, res) => {
  try {
    const { message, userId } = req.body;

    const result = await routeAgent("chat", {
      message,
      userId: userId ?? "direct-test"
    });

    return res.json({
      success: true,
      result,
      confidence: 0.95
    });
  } catch (err: any) {
    console.error("AI execute error:", err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Twilio SMS webhook (TwiML response)
 */
app.post("/sms", async (req, res) => {
  try {
    const incomingMessage = req.body?.Body;
    const from = req.body?.From;

    console.log("Raw body:", req.body);

    if (!incomingMessage || !from) {
      console.error("Missing Body or From field");
      return res.sendStatus(400);
    }

    console.log("Incoming SMS from:", from);
    console.log("Message:", incomingMessage);

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

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Maya SMS Agent running on port ${PORT}`);
});
