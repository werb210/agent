import { calculateConfidence } from "../core/mayaConfidence";
import { resilientLLM } from "../infrastructure/mayaResilience";

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
  const prompt = `${SYSTEM_PROMPT}\n\nUser input:\n${userInput}`;
  const result = await resilientLLM("analysis", prompt);
  const content = result.output;

  return {
    ...JSON.parse(content || "{}"),
    confidence: calculateConfidence(content),
    model: result.model
  };
}
