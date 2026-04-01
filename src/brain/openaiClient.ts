import type { ChatCompletionMessageParam } from "openai/resources";
import { resilientLLM } from "../infrastructure/mayaResilience";
import { sanitizeModelInput } from "../services/inputSanitizer";

type InvocationScope = {
  role?: string;
  applicationId?: string;
  userId?: string;
  actionType?: string;
};

export async function runAI(
  source: string,
  message: string,
  history: { role: "user" | "assistant"; content: string }[] = [],
  context: InvocationScope = {}
): Promise<any> {
  const normalizedRole = context?.role?.toLowerCase();
  const allowedRoles = new Set(["admin", "staff", "system"]);

  if (normalizedRole && !allowedRoles.has(normalizedRole)) {
    const err: any = new Error("forbidden");
    err.code = "forbidden";
    err.status = 403;
    throw err;
  }

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: sanitizeModelInput(source) },
    ...history.map((item) => ({ ...item, content: sanitizeModelInput(item.content) })),
    { role: "user", content: sanitizeModelInput(message) }
  ];

  const prompt = messages
    .map((entry) => `${entry.role.toUpperCase()}: ${entry.content}`)
    .join("\n\n");

  const result = await resilientLLM("analysis", prompt, {
    applicationId: context?.applicationId,
    userId: context?.userId,
    actionType: context?.actionType ?? "maya_chat"
  });

  return result.output;
}
