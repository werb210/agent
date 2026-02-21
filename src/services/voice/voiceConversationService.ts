import { pool } from "../../db";
import { runAI } from "../../brain/openaiClient";
import { logDecision } from "../complianceLogger";
import { evaluateQualification } from "./qualificationEngine";

export async function handleVoiceInput(sessionId: string, userSpeech: string) {
  const session = await pool.query(
    "SELECT transcript FROM maya_voice_sessions WHERE id = $1",
    [sessionId]
  );

  const transcript = session.rows[0]?.transcript || "";
  const updatedTranscript = `${transcript}\nUser: ${userSpeech}`;

  // Evaluate qualification
  const qualification = await evaluateQualification(sessionId, userSpeech);

  const response = await runAI(
    "You are Maya, a professional funding assistant. Never give legal or financial advice. Do not estimate approval. Do not explain underwriting.",
    updatedTranscript
  );

  await pool.query(
    "UPDATE maya_voice_sessions SET transcript = $1 WHERE id = $2",
    [`${updatedTranscript}\nMaya: ${response ?? ""}`, sessionId]
  );

  await logDecision(
    "voice_response",
    { userSpeech },
    { response, qualification },
    "Voice AI response generated with qualification evaluation"
  );

  return response ?? "Could you repeat that?";
}
