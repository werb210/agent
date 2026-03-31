import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { twiml } from "twilio";
import { pool } from "../db";
import { runAI } from "../brain/openaiClient";
import { logDecision } from "../services/complianceLogger";
import { sanitizeString } from "../security/sanitizer";
import { verifyTwilioSignature } from "../middleware/verifyTwilio";
import { mayaRateLimit } from "../middleware/rateLimit";
import { saveEvent } from "../lib/eventStore";
import { getState, saveState } from "../lib/conversationState";

const router = Router();

router.post("/sms", mayaRateLimit, verifyTwilioSignature, async (req, res) => {
  const from = sanitizeString(String(req.body?.From ?? ""));
  const body = sanitizeString(String(req.body?.Body ?? ""));

  if (!from || !body) {
    return res.sendStatus(400);
  }

  const session = await pool.request(
    "SELECT id, transcript FROM maya_voice_sessions WHERE phone = $1 AND status = 'active' LIMIT 1",
    [from]
  );

  let sessionId: string;

  if (!session.rows.length) {
    sessionId = uuidv4();
    await pool.request(
      "INSERT INTO maya_voice_sessions (id, phone) VALUES ($1, $2)",
      [sessionId, from]
    );
  } else {
    sessionId = session.rows[0].id;
  }

  const previousTranscript = session.rows[0]?.transcript || "";
  const updatedTranscript = `${previousTranscript}\nUser: ${body}`;

  await saveEvent({
    callId: sessionId,
    type: "user_message",
    payload: { text: body }
  });

  const existingState = await getState(sessionId);
  let state: Record<string, unknown> = {
    sessionId,
    channel: "sms",
    transcript: updatedTranscript,
    lastUserMessage: body
  };

  if (existingState) {
    state = { ...(existingState as Record<string, unknown>), transcript: updatedTranscript, lastUserMessage: body };
  }
  await saveState(sessionId, state);

  const aiResponse = await runAI(
    "You are Maya, a professional funding assistant.",
    JSON.stringify({ conversation: updatedTranscript })
  );

  await pool.request(
    "UPDATE maya_voice_sessions SET transcript = $1 WHERE id = $2",
    [`${updatedTranscript}\nMaya: ${aiResponse ?? ""}`, sessionId]
  );

  await saveEvent({
    callId: sessionId,
    type: "assistant_message",
    payload: { text: aiResponse ?? "Thank you. We will follow up shortly." }
  });

  state = { ...state, lastAssistantMessage: aiResponse ?? "Thank you. We will follow up shortly." };
  await saveState(sessionId, state);

  await logDecision("sms_response", { body }, { aiResponse }, "SMS test mode response");

  const response = new twiml.MessagingResponse();
  response.message(aiResponse ?? "Thank you. We will follow up shortly.");

  res.type("text/xml");
  return res.send(response.toString());
});

export default router;
