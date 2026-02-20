import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
});

export async function generateUnderwritingMemo(input: {
  requestedAmount: number;
  industry: string;
  revenue?: number;
  creditScore?: number;
  readiness?: string;
}) {
  const prompt = `
Create a structured underwriting memo with sections:
Transaction
Overview
Financial Summary
Risks & Mitigants
Rationale for Approval

Data:
Amount: ${input.requestedAmount}
Industry: ${input.industry}
Revenue: ${input.revenue}
Credit: ${input.creditScore}
Readiness: ${input.readiness}
`;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0.2,
    messages: [{ role: "user", content: prompt }]
  });

  return completion.choices[0].message.content;
}
