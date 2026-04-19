import { runAI } from "../../brain/openaiClient.js";
import { logDecision } from "../complianceLogger.js";
import { evaluateQualification } from "./qualificationEngine.js";
import { getAvailableStaff } from "../staff/staffAvailability.js";
import { createBooking } from "../booking/o365BookingService.js";
import { getState, saveState } from "../../lib/conversationState.js";
import { saveEvent } from "../../lib/eventStore.js";
import { logger } from "../../infrastructure/logger.js";
import { callBFServer } from "../../integrations/bfServerClient.js";

export async function handleVoiceInput(sessionId: string, userSpeech: string) {
  const existingState = await getState(sessionId);
  const transcript = String((existingState as Record<string, unknown> | null)?.transcript ?? "");
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

  if (existingState) {
    logger.info("voice_session_resume", {
      callId: sessionId,
      operation: "voice_session_resume",
      status: "ok"
    });
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

  const transcriptWithResponse = `${updatedTranscript}\nMaya: ${response ?? ""}`;
  await callBFServer("/api/calls/transcript", {
    sessionId,
    transcript: transcriptWithResponse,
  });

  await saveEvent({
    callId: sessionId,
    type: "assistant_message",
    payload: { text: response ?? "Could you repeat that?" }
  });

  state = { ...state, transcript: transcriptWithResponse, step: "responded", lastAssistantMessage: response ?? "Could you repeat that?" };
  await saveState(sessionId, state);

  await logDecision(
    "voice_response",
    { userSpeech },
    { response, qualification },
    "Voice AI response generated with qualification evaluation"
  );

  return response ?? "Could you repeat that?";
}
