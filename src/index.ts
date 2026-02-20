import express from "express";
import dotenv from "dotenv";
import twilio from "twilio";

dotenv.config();

const app = express();
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const PORT = 4000;

const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_PHONE_NUMBER
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
  console.error("Missing Twilio environment variables");
  process.exit(1);
}

const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/*
  AUTO TEXT ON START
*/
async function sendStartupMessage() {
  try {
    const message = await client.messages.create({
      body: "Agent is live and operational.",
      from: TWILIO_PHONE_NUMBER,
      to: "+15878881837"
    });

    console.log("Startup SMS sent:", message.sid);
  } catch (err) {
    console.error("Startup SMS failed:", err);
  }
}

/*
  INBOUND SMS WEBHOOK
*/
app.post("/sms", async (req, res) => {
  const incomingMessage = req.body.Body;
  const fromNumber = req.body.From;

  console.log("Incoming SMS:", incomingMessage, "From:", fromNumber);

  try {
    await client.messages.create({
      body: `Echo: ${incomingMessage}`,
      from: TWILIO_PHONE_NUMBER,
      to: fromNumber
    });

    res.status(200).send("OK");
  } catch (err) {
    console.error("Reply failed:", err);
    res.status(500).send("Error");
  }
});

/*
  HEALTH CHECK
*/
app.get("/", (_, res) => {
  res.send("Agent running.");
});

app.listen(PORT, async () => {
  console.log(`AI Agent running on port ${PORT}`);
  await sendStartupMessage();
});
