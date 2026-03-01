import { runAI } from "../brain/openaiClient";
import { SessionStage } from "../types/stages";
import { MayaMode } from "../types/maya";
import { MAYA_SYSTEM_PROMPT } from "../prompts/system";

type ConversationTurn = {
  role: "user" | "assistant";
  content: string;
};

export async function runMayaCore(
  message: string,
  stage: SessionStage,
  mode: MayaMode,
  history: ConversationTurn[] = [],
  scope?: { role: "Admin" | "Staff" | string; applicationId?: string; userId?: string }
): Promise<string> {
  const systemPrompt = await buildSystemPrompt(mode, stage);

  const aiScope = scope
    ? {
      ...scope,
      actionType: "maya_stage_reply"
    }
    : undefined;

  return (await runAI(systemPrompt, message, history, aiScope)) ?? "Insufficient data provided.";
}

async function buildSystemPrompt(mode: MayaMode, stage: SessionStage): Promise<string> {
  return `${MAYA_SYSTEM_PROMPT}\nMode: ${mode}\nStage: ${stage}`;
}
