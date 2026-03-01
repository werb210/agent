import type { ChatCompletionMessageParam } from "openai/resources";
import { resilientLLM } from "../infrastructure/mayaResilience";
import { AppError } from "../errors/AppError";
import { sanitizeModelInput } from "../services/inputSanitizer";

type InvocationScope = {
  role: "Admin" | "Staff" | string;
  applicationId?: string;
  userId?: string;
  actionType?: string;
};

export async function runAI(
  systemPrompt: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  scope?: InvocationScope
) {
  if (scope && scope.role !== "Admin" && scope.role !== "Staff") {
    throw new AppError("forbidden", 403);
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: sanitizeModelInput(systemPrompt) },
    ...history.map((item) => ({ ...item, content: sanitizeModelInput(item.content) })),
    { role: "user", content: sanitizeModelInput(userMessage) }
  ];

  const prompt = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  const result = await resilientLLM("analysis", prompt, {
    applicationId: scope?.applicationId,
    userId: scope?.userId,
    actionType: scope?.actionType ?? "maya_chat"
  });
  return result.output;
}
