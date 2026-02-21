import { runAI } from "../brain/openaiClient";
import { SessionStage } from "../types/stages";

type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function runMayaCore(
  message: string,
  stage: SessionStage,
  history: ConversationTurn[] = []
): Promise<string> {
  const systemPrompt = `
You are Maya, Boreal's AI funding assistant.

Current session stage: ${stage}

Guide the user forward in the funding process.
Never give underwriting decisions.
Never estimate approval.
Never negotiate rates.
Escalate when uncertain.
`;

  return (await runAI(systemPrompt, message, history)) ?? "Could you share a bit more detail?";
}
