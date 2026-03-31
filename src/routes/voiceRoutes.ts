import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { twiml } from "twilio";
import { handleVoiceInput } from "../services/voice/voiceConversationService";
import { verifyTwilioSignature } from "../middleware/verifyTwilio";
import { mayaRateLimit } from "../middleware/rateLimit";
import { bfServerRequest } from "../integrations/bfServerClient";
import { saveEvent } from "../lib/eventStore";
import { saveState } from "../lib/conversationState";

const router = Router();

router.post("/voice/inbound", mayaRateLimit, verifyTwilioSignature, async (req, res) => {
  const callSid = String(req.body.CallSid ?? "");
  const phone = String(req.body.From ?? "");
  const sessionId = uuidv4();

  await bfServerRequest("/api/calls/log", "POST", { callSid, phone, sessionId, event: "voice_inbound" });

  await saveEvent({
    callId: sessionId,
    type: "call_started",
    payload: { callSid, phone }
  });

  await saveState(sessionId, {
    sessionId,
    callSid,
    phone,
    channel: "voice",
    step: "inbound"
  });

  const response = new twiml.VoiceResponse();
  response.say("Hello, this is Maya from Boreal Financial.");
  const gather = response.gather({
    input: ["speech", "dtmf"],
    timeout: 5,
    numDigits: 1,
    action: `/api/voice/respond?sessionId=${sessionId}`,
    method: "POST"
  });

  gather.say("Press 1 to speak to an agent. Press 2 to leave a voicemail. Press 3 to receive an SMS link.");

  res.type("text/xml");
  res.send(response.toString());
});

router.post("/voice/respond", mayaRateLimit, verifyTwilioSignature, async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const speech = String(req.body.SpeechResult ?? "");
  const digits = String(req.body.Digits ?? "");

  const response = new twiml.VoiceResponse();

  if (digits === "1") {
    await saveEvent({ callId: sessionId, type: "user_message", payload: { text: "DTMF:1" } });
    response.say("Connecting you to an agent.");
    await saveEvent({ callId: sessionId, type: "assistant_message", payload: { text: "Connecting you to an agent." } });
    response.dial(process.env.TRANSFER_NUMBER || "");
    await saveState(sessionId, { sessionId, step: "transfer_requested" });
  } else if (digits === "2") {
    await saveEvent({ callId: sessionId, type: "user_message", payload: { text: "DTMF:2" } });
    response.say("Please leave your voicemail after the beep.");
    await saveEvent({ callId: sessionId, type: "assistant_message", payload: { text: "Please leave your voicemail after the beep." } });
    response.record({ action: "/api/voice/voicemail", method: "POST" });
    await saveState(sessionId, { sessionId, step: "voicemail" });
  } else if (digits === "3") {
    await saveEvent({ callId: sessionId, type: "user_message", payload: { text: "DTMF:3" } });
    await bfServerRequest("/api/calls/log", "POST", { sessionId, event: "sms_link_requested" });
    response.say("We sent you a text with a secure application link.");
    await saveEvent({ callId: sessionId, type: "assistant_message", payload: { text: "We sent you a text with a secure application link." } });
    await saveState(sessionId, { sessionId, step: "sms_link_sent" });
  } else {
    const aiResponse = await handleVoiceInput(sessionId, speech);
    response.say(typeof aiResponse === "string" ? aiResponse : "Could you repeat that?");
  }

  const gather = response.gather({
    input: ["speech", "dtmf"],
    timeout: 5,
    numDigits: 1,
    action: `/api/voice/respond?sessionId=${sessionId}`,
    method: "POST"
  });
  gather.say("Press 1 for agent, 2 for voicemail, 3 for SMS link.");

  res.type("text/xml");
  res.send(response.toString());
});

router.post("/voice/voicemail", mayaRateLimit, verifyTwilioSignature, async (req, res) => {
  const payload = {
    callSid: String(req.body.CallSid ?? ""),
    recordingUrl: String(req.body.RecordingUrl ?? ""),
    from: String(req.body.From ?? "")
  };

  await bfServerRequest("/api/calls/voicemail", "POST", payload);
  res.sendStatus(200);
});

export default router;
