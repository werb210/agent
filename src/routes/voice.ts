import express from "express";
import { VoiceResponse } from "twilio/lib/twiml/VoiceResponse";

const router = express.Router();

router.post("/incoming", (req, res) => {
  const twiml = new VoiceResponse();

  twiml.say("Hello. You are speaking with Maya.");

  twiml.connect().stream({
    url: "wss://your-agent-domain/ws",
  });

  res.type("text/xml");
  res.send(twiml.toString());
});

export default router;
