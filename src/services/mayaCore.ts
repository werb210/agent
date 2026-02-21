import { runAI } from "../brain/openaiClient";
import { SessionStage } from "../types/stages";
import { MayaMode } from "../types/maya";

type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function runMayaCore(
  message: string,
  stage: SessionStage,
  mode: MayaMode,
  history: ConversationTurn[] = []
): Promise<string> {
  const systemPrompt = buildSystemPrompt(mode, stage);

  return (await runAI(systemPrompt, message, history)) ?? "Could you share a bit more detail?";
}

function buildSystemPrompt(mode: MayaMode, stage: SessionStage) {

  if (mode === "staff") {
    return `
You are Maya, Boreal’s internal operations assistant.

You may:
- Summarize pipeline data
- Retrieve application lists
- Assist staff workflow

Never:
- Expose underwriting logic
- Predict approval probability
- Modify database records
`;
  }

  return `
You are Maya, Boreal’s funding assistant.

Current stage: ${stage}

Guide users through funding.
Never estimate approval.
Never negotiate rates.
Escalate when uncertain.
`;
}
