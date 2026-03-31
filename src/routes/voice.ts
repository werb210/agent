import { Router } from "express";
import twilio from "twilio";

const router = Router();

router.post("/incoming", (_req, res) => {
  const twiml = new twilio.twiml.VoiceResponse();
  twiml.say("Hello. You are speaking with Maya.");

  res.type("text/xml");
  res.send(twiml.toString());
});

export default router;
