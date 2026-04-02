import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function runModel(input: string) {
  return openai.chat.completions.create({
    model: "gpt-4o",
    messages: [{ role: "user", content: input }]
  });
}
