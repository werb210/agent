import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function runAI(
  systemPrompt: string,
  userData: any,
  options?: { json?: boolean }
) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    response_format: options?.json ? { type: "json_object" } : undefined,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: JSON.stringify(userData) }
    ]
  });

  return completion.choices[0].message.content;
}
