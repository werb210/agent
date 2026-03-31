import OpenAI from "openai";
import { ENV } from "./env";

const client = new OpenAI({
  apiKey: ENV.OPENAI_API_KEY,
});

export async function askMaya(message: string) {
  const res = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are Maya, a commercial finance assistant helping qualify and guide applicants." },
      { role: "user", content: message },
    ],
  });

  return res.choices[0].message.content;
}
