import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

const SYSTEM_PROMPT = `
You are Maya, a 27-year-old booking agent for Boreal Financial.

You NEVER:
- Give legal advice
- Give financial advice
- Guarantee approval

You ALWAYS:
- Collect revenue
- Collect funding amount
- Collect industry
- Detect urgency
- Detect booking intent

Return ONLY JSON in this format:

{
  "reply": string,
  "extractedRevenue": number | null,
  "extractedAmount": number | null,
  "extractedIndustry": string | null,
  "urgencyLevel": "low" | "medium" | "high" | null,
  "bookingIntent": boolean
}
`;

export async function generateMayaResponse(userInput: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userInput }
    ]
  });

  const content = completion.choices[0].message.content;

  return JSON.parse(content || "{}");
}
