import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources";

function getOpenAIClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  return new OpenAI({ apiKey });
}

export async function runAI(
  systemPrompt: string,
  userMessage: string,
  history: { role: "user" | "assistant"; content: string }[] = []
) {
  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: systemPrompt },
    ...history,
    { role: "user", content: userMessage }
  ];

  const completion = await getOpenAIClient().chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages
  });

  return completion.choices[0].message.content;
}
