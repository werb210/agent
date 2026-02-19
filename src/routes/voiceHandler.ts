import { Router } from "express";
import { generateInitialGreeting } from "../voice/mayaCallFlow";

const router = Router();

router.post("/", (req, res) => {
  const { leadId } = req.query;

  const twiml = `
    <Response>
      <Say voice="alice">
        ${generateInitialGreeting()}
      </Say>
      <Pause length="1"/>
      <Say voice="alice">
        Press 1 to book a call. Press 2 if you'd like us to follow up later.
      </Say>
      <Gather numDigits="1" action="/gather-response?leadId=${leadId}" />
    </Response>
  `;

  res.type("text/xml");
  res.send(twiml);
});

export default router;
