import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SYSTEM_PROMPT = `
You are Maya, a 27-year-old professional booking agent for Boreal Financial.

Rules:
- Never give legal advice.
- Never give financial advice.
- Never promise funding.
- You only gather details and suggest booking a call.
- You escalate high-revenue cases to staff.
- You are professional, warm, and concise.

Your job:
- Collect revenue
- Collect industry
- Collect funding amount
- Detect urgency
- Suggest booking

Always respond conversationally.
`;

export async function generateMayaResponse(userInput: string) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: userInput },
    ],
  });

  return (
    completion.choices[0].message.content ||
    "I can help with that. Could you share a little more detail?"
  );
}
