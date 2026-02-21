import { pool } from "../db";

const pricing: Record<string, number> = {
  "gpt-4o": 0.00001,
  "gpt-4": 0.00003
};

export async function trackLLMUsage(
  model: string,
  inputTokens: number,
  outputTokens: number
) {
  const totalTokens = inputTokens + outputTokens;
  const cost = totalTokens * (pricing[model] || 0.00002);

  await pool.query(
    `INSERT INTO maya_llm_usage (model, tokens_input, tokens_output, estimated_cost)
     VALUES ($1,$2,$3,$4)`,
    [model, inputTokens, outputTokens, cost]
  );
}

