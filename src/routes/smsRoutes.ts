import { Router } from "express";
import { v4 as uuidv4 } from "uuid";
import { twiml } from "twilio";
import { pool } from "../db";
import { runAI } from "../brain/openaiClient";
import { logDecision } from "../services/complianceLogger";
import { sanitizeString } from "../security/sanitizer";

const router = Router();

router.post("/sms", async (req, res) => {
  const from = sanitizeString(String(req.body?.From ?? ""));
  const body = sanitizeString(String(req.body?.Body ?? ""));

  if (!from || !body) {
    return res.sendStatus(400);
  }

  const session = await pool.query(
    "SELECT id, transcript FROM maya_voice_sessions WHERE phone = $1 AND status = 'active' LIMIT 1",
    [from]
  );

  let sessionId: string;

  if (!session.rows.length) {
    sessionId = uuidv4();
    await pool.query(
      "INSERT INTO maya_voice_sessions (id, phone) VALUES ($1, $2)",
      [sessionId, from]
    );
  } else {
    sessionId = session.rows[0].id;
  }

  const previousTranscript = session.rows[0]?.transcript || "";
  const updatedTranscript = `${previousTranscript}\nUser: ${body}`;

  const aiResponse = await runAI(
    "You are Maya, a professional funding assistant.",
    JSON.stringify({ conversation: updatedTranscript })
  );

  await pool.query(
    "UPDATE maya_voice_sessions SET transcript = $1 WHERE id = $2",
    [`${updatedTranscript}\nMaya: ${aiResponse ?? ""}`, sessionId]
  );

  await logDecision("sms_response", { body }, { aiResponse }, "SMS test mode response");

  const response = new twiml.MessagingResponse();
  response.message(aiResponse ?? "Thank you. We will follow up shortly.");

  res.type("text/xml");
  return res.send(response.toString());
});

export default router;
