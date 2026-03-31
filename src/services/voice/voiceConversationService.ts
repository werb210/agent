import { pool } from "../../db";
import { runAI } from "../../brain/openaiClient";
import { logDecision } from "../complianceLogger";
import { evaluateQualification } from "./qualificationEngine";
import { getAvailableStaff } from "../staff/staffAvailability";
import { createBooking } from "../booking/o365BookingService";
import { getState, saveState } from "../../lib/conversationState";
import { saveEvent } from "../../lib/eventStore";

export async function handleVoiceInput(sessionId: string, userSpeech: string) {
  const session = await pool.request(
    "SELECT transcript FROM maya_voice_sessions WHERE id = $1",
    [sessionId]
  );

  const transcript = session.rows[0]?.transcript || "";
  const updatedTranscript = `${transcript}\nUser: ${userSpeech}`;

  await saveEvent({
    callId: sessionId,
    type: "user_message",
    payload: { text: userSpeech }
  });

  let state: Record<string, unknown> = {
    sessionId,
    transcript: updatedTranscript,
    lastUserMessage: userSpeech,
    step: "qualification"
  };

  const existingState = await getState(sessionId);
  if (existingState) {
    // eslint-disable-next-line no-console
    console.log("Resuming call state");
    state = {
      ...(existingState as Record<string, unknown>),
      transcript: updatedTranscript,
      lastUserMessage: userSpeech,
      step: "qualification"
    };
  }
  await saveState(sessionId, state);

  const qualification = await evaluateQualification(sessionId, userSpeech);
  state = { ...state, qualification, step: "routing" };
  await saveState(sessionId, state);

  // Escalation logic
  if (qualification.escalation === "high_intent") {
    const staff = await getAvailableStaff();

    if (staff) {
      await saveEvent({
        callId: sessionId,
        type: "assistant_message",
        payload: { text: "Connecting you to an available team member now." }
      });

      state = { ...state, step: "transfer", transfer: true, staffPhone: staff.phone };
      await saveState(sessionId, state);

      return {
        transfer: true,
        staffPhone: staff.phone
      };
    }

    await createBooking(userSpeech);

    const fallbackMessage = "Our team is currently assisting other clients. I've sent you a booking link to schedule a call at your convenience.";
    await saveEvent({
      callId: sessionId,
      type: "assistant_message",
      payload: { text: fallbackMessage }
    });

    state = { ...state, step: "booking_fallback", lastAssistantMessage: fallbackMessage };
    await saveState(sessionId, state);

    return fallbackMessage;
  }

  const response = await runAI(
    "You are Maya, a professional funding assistant. Never give legal or financial advice. Do not estimate approval. Do not explain underwriting.",
    updatedTranscript
  );

  await pool.request(
    "UPDATE maya_voice_sessions SET transcript = $1 WHERE id = $2",
    [`${updatedTranscript}\nMaya: ${response ?? ""}`, sessionId]
  );

  await saveEvent({
    callId: sessionId,
    type: "assistant_message",
    payload: { text: response ?? "Could you repeat that?" }
  });

  state = { ...state, step: "responded", lastAssistantMessage: response ?? "Could you repeat that?" };
  await saveState(sessionId, state);

  await logDecision(
    "voice_response",
    { userSpeech },
    { response, qualification },
    "Voice AI response generated with qualification evaluation"
  );

  return response ?? "Could you repeat that?";
}
