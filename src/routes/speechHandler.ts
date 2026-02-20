import { Router } from "express";
import { generateMayaResponse } from "../voice/mayaConversation";

const router = Router();

router.post("/", async (req, res) => {
  const speech = req.body.SpeechResult || "";

  const reply = await generateMayaResponse(speech);

  const twiml = `
    <Response>
      <Say voice="alice">
        ${reply}
      </Say>
      <Gather input="speech" action="/speech-handler" method="POST" speechTimeout="auto"/>
    </Response>
  `;

  res.type("text/xml");
  res.send(twiml);
});

export default router;
