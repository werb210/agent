import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Twilio from "twilio";
import { routeAgent } from "./router/agentRouter";

const app = express();

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: false }));

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
    return res.status(500).json({ error: err.message });
  }
});

/**
 * Twilio SMS webhook (TwiML-based response)
 */
app.post("/sms", async (req, res) => {
  try {
    const incomingMessage = req.body.Body;
    const from = req.body.From;

    if (!incomingMessage || !from) {
      return res.sendStatus(400);
    }

    console.log("Incoming SMS from:", from);
    console.log("Message:", incomingMessage);

    const result = await routeAgent("chat", {
      message: incomingMessage,
      userId: from
    });

    const twiml = new Twilio.twiml.MessagingResponse();
    twiml.message(result?.content ?? "No response.");

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
