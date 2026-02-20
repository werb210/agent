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
    const { message } = req.body;

    const result = await routeAgent("chat", { message });

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
 * Twilio SMS webhook
 */
app.post("/sms", async (req, res) => {
  try {
    const incomingMessage = req.body.Body;
    const from = req.body.From;

    if (!incomingMessage || !from) {
      return res.sendStatus(400);
    }

    const result = await routeAgent("chat", {
      message: incomingMessage
    });

    const client = Twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    await client.messages.create({
      body: result.content ?? "",
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: from
    });

    return res.sendStatus(200);
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }
});

const PORT = 4000;

app.listen(PORT, () => {
  console.log(`Maya SMS Agent running on port ${PORT}`);
});
