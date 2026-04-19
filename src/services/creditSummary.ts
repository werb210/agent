import { z } from "zod";
import { resilientLLM } from "../infrastructure/mayaResilience.js";
import { AppError } from "../errors/AppError.js";
import { sanitizeModelInput } from "./inputSanitizer.js";

const creditSummaryZodSchema = z.object({
  transaction: z.string(),
  overview: z.string(),
  collateral: z.string(),
  financialSummary: z.string(),
  risks: z.array(z.string()),
  rationale: z.string()
});

export const CREDIT_SUMMARY_SCHEMA = {
  name: "credit_summary",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      transaction: { type: "string" },
      overview: { type: "string" },
      collateral: { type: "string" },
      financialSummary: { type: "string" },
      risks: {
        type: "array",
        items: { type: "string" }
      },
      rationale: { type: "string" }
    },
    required: ["transaction", "overview", "collateral", "financialSummary", "risks", "rationale"]
  }
} as const;

export type CreditSummary = z.infer<typeof creditSummaryZodSchema>;

export async function generateCreditSummary(input: {
  applicationId: string;
  userId: string;
  role: "Admin" | "Staff";
  payload: string;
}): Promise<CreditSummary> {
  const prompt = `Generate a strict credit summary from this data:\n${sanitizeModelInput(input.payload)}`;

  const response = await resilientLLM("analysis", prompt, {
    responseFormat: {
      type: "json_schema",
      json_schema: CREDIT_SUMMARY_SCHEMA
    },
    applicationId: input.applicationId,
    userId: input.userId,
    actionType: "credit_summary"
  });

  let parsed: unknown;
  try {
    parsed = JSON.parse(response.output);
  } catch {
    throw new AppError("maya_failure", 500, "Malformed model output");
  }

  const validation = creditSummaryZodSchema.safeParse(parsed);
  if (!validation.success) {
    throw new AppError("maya_failure", 500, "Credit summary schema validation failed");
  }

  return validation.data;
}
