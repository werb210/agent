import { runAI } from "../brain/openaiClient.js";

export async function generateCreditMemo(deal: any) {
  const prompt = `
Write a professional broker credit memo.

Include:
- Transaction Summary
- Business Overview
- Financial Snapshot
- Strengths
- Risks
- Recommended Structure
`;

  return runAI(prompt, JSON.stringify(deal));
}
