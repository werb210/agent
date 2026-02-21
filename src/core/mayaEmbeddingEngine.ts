import OpenAI from "openai";
import { pool } from "../db";
import { trackLLMUsage } from "../infrastructure/llmCostTracker";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function storeEmbedding(entityType: string, entityId: string, text: string): Promise<void> {
  const estimatedInputTokens = Math.ceil(text.length / 4);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  await trackLLMUsage("text-embedding-3-small", estimatedInputTokens, 0);

  const embedding = response.data[0]?.embedding;

  if (!embedding) {
    throw new Error("Embedding response was empty.");
  }

  await pool.query(
    `INSERT INTO maya_vector_memory (entity_type, entity_id, embedding, metadata)
     VALUES ($1, $2, $3::float8[], $4)`,
    [entityType, entityId, embedding, { text }]
  );
}

export async function searchSimilar(text: string): Promise<Array<{ entity_id: string; metadata: unknown }>> {
  const estimatedInputTokens = Math.ceil(text.length / 4);
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text
  });
  await trackLLMUsage("text-embedding-3-small", estimatedInputTokens, 0);

  const queryEmbedding = response.data[0]?.embedding;

  if (!queryEmbedding) {
    return [];
  }

  const result = await pool.query<{ entity_id: string; metadata: unknown }>(
    `SELECT entity_id, metadata
     FROM maya_vector_memory AS mvm
     ORDER BY (
       SELECT SQRT(SUM(POWER(mvm.embedding[idx] - ($1::float8[])[idx], 2)))
       FROM generate_subscripts(mvm.embedding, 1) AS idx
     ) ASC
     LIMIT 5`,
    [queryEmbedding]
  );

  return result.rows;
}
