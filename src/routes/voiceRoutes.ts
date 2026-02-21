import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { twiml } from "twilio";
import { pool } from "../db";
import { handleVoiceInput } from "../services/voice/voiceConversationService";

const router = Router();

router.post("/voice/inbound", async (req, res) => {
  const callSid = req.body.CallSid;
  const phone = req.body.From;
  const sessionId = uuidv4();

  await pool.query(
    "INSERT INTO maya_voice_sessions (id, call_sid, phone) VALUES ($1, $2, $3)",
    [sessionId, callSid, phone]
  );

  const response = new twiml.VoiceResponse();
  response.say("Hello, this is Maya from Boreal Financial. How can I help you today?");
  response.gather({
    input: ["speech"],
    action: `/api/voice/respond?sessionId=${sessionId}`,
    method: "POST"
  });

  res.type("text/xml");
  res.send(response.toString());
});

router.post("/voice/respond", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const speech = req.body.SpeechResult;

  const aiResponse = await handleVoiceInput(sessionId, speech);

  const response = new twiml.VoiceResponse();

  if (typeof aiResponse === "object" && aiResponse !== null && aiResponse.transfer) {
    response.say("Please hold while I connect you to a funding specialist.");
    response.dial(aiResponse.staffPhone);
  } else {
    response.say(typeof aiResponse === "string" ? aiResponse : "Could you repeat that?");
  }

  response.gather({
    input: ["speech"],
    action: `/api/voice/respond?sessionId=${sessionId}`,
    method: "POST"
  });

  res.type("text/xml");
  res.send(response.toString());
});

export default router;
