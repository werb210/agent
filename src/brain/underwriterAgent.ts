import { resilientLLM } from "../infrastructure/mayaResilience";

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

  const result = await resilientLLM("analysis", prompt);
  return result.output;
}
