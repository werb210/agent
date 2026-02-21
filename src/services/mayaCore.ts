import { runAI } from "../brain/openaiClient";
import { SessionStage } from "../types/stages";
import { MayaMode } from "../types/maya";
import { getAvailableProductCategories } from "../core/mayaProductIntelligence";

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
  const systemPrompt = await buildSystemPrompt(mode, stage);

  return (await runAI(systemPrompt, message, history)) ?? "Could you share a bit more detail?";
}

async function buildSystemPrompt(mode: MayaMode, stage: SessionStage): Promise<string> {

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

  const categories = await getAvailableProductCategories();

  const productContext = `
Available product categories:
${categories.join(", ")}

You must only reference products that exist in this list.
If asked about a category not in this list, say it is not currently offered.
Never invent products.
`;

  return `
You are Maya, Boreal’s funding assistant.

Current stage: ${stage}

Guide users through funding.
Never estimate approval.
Never negotiate rates.
Escalate when uncertain.

${productContext}
`;
}
