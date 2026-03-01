import { Router } from "express";
import { verifyTwilioSignature } from "../middleware/verifyTwilio";
import { mayaRateLimit } from "../middleware/rateLimit";

const router = Router();

router.post("/", mayaRateLimit, verifyTwilioSignature, (_req, res) => {
  const twiml = `
    <Response>
      <Say voice="alice">
        Hi, this is Maya from Boreal Financial. How can I help you today?
      </Say>
      <Gather input="speech" action="/speech-handler" method="POST" speechTimeout="auto"/>
    </Response>
  `;

  res.type("text/xml");
  res.send(twiml);
});

export default router;
