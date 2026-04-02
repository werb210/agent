import { Router } from "express";
import { twiml } from "twilio";
import { ENV } from "../config/env";

const router = Router();

router.post("/", (_req, res) => {
  const response = new twiml.VoiceResponse();

  response.connect().stream({
    url: `${ENV.WS_URL}/ws/voice`
  });

  res.type("text/xml");
  res.send(response.toString());
});

export default router;
