import OpenAI from "openai";

export function getOpenAI() {
  return new OpenAI();
}

export async function runModel(input: string) {
  return getOpenAI().chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: input }],
  });
}
