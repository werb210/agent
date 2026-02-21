import OpenAI, { toFile } from "openai";
import { calculateConfidence } from "../core/mayaConfidence";
import { resilientLLM } from "../infrastructure/mayaResilience";
import { trackLLMUsage } from "../infrastructure/llmCostTracker";

type MemoryTurn = {
  user: string;
  assistant: string;
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "sk-placeholder"
});

export type ChatCompletionResult = {
  message: {
    role: "assistant";
    content: string;
  };
  confidence: number;
  model: string;
};

export async function createChatCompletion(message: string, memory: MemoryTurn[] = []): Promise<ChatCompletionResult> {
  const memoryPrompt = memory
    .map((turn) => `USER: ${turn.user}\nASSISTANT: ${turn.assistant}`)
    .join("\n\n");

  const prompt = `
You are Maya, an intelligent SMS business assistant.
You can book calls and respond naturally.
When appropriate, use tools.
Respond conversationally if no tool is needed.

Conversation history:
${memoryPrompt || "(none)"}

User:
${message}
`;

  const result = await resilientLLM("analysis", prompt);

  return {
    message: {
      role: "assistant",
      content: result.output
    },
    confidence: calculateConfidence(result.output),
    model: result.model
  };
}

export async function transcribeAudio(recordingUrl: string): Promise<string> {
  const response = await fetch(recordingUrl);
  if (!response.ok) {
    throw new Error(`Unable to download recording for transcription: ${response.status}`);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  const audioFile = await toFile(audioBuffer, "call-recording.wav", { type: "audio/wav" });

  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: "gpt-4o-mini-transcribe"
  });

  const estimatedOutputTokens = Math.ceil((transcription.text || "").length / 4);
  await trackLLMUsage("gpt-4o-mini-transcribe", 0, estimatedOutputTokens);

  return transcription.text;
}

export async function summarizeFundingCall(transcript: string): Promise<string> {
  const prompt = `Summarize this funding call. Extract key financials and risk indicators.\n\n${transcript}`;
  const result = await resilientLLM("analysis", prompt);
  return result.output.trim() || "No summary generated.";
}
