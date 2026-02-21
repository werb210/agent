import type { ChatCompletionMessageParam } from "openai/resources";
import { resilientLLM } from "../infrastructure/mayaResilience";

export async function runAI(
  systemPrompt: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = []
) {
  const strictRules =
    "\n\nSTRICT RULES:" +
    "\n- Never estimate approval." +
    "\n- Never predict rates." +
    "\n- Never explain underwriting logic." +
    "\n- Never negotiate." +
    "\n- Keep responses concise and professional.";

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: `${systemPrompt}${strictRules}` },
    ...history,
    { role: "user", content: userMessage }
  ];

  const prompt = messages
    .map((message) => `${message.role.toUpperCase()}: ${message.content}`)
    .join("\n\n");

  const result = await resilientLLM("analysis", prompt);
  return result.output;
}
