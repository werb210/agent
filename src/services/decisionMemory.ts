import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

interface DecisionMemoryInput {
  sessionId: string;
  decisionType: string;
  confidence: number;
  outcome: string;
}

export async function logDecisionMemory(input: DecisionMemoryInput) {
  await pool.query(
    `INSERT INTO maya_decisions (session_id, decision_type, confidence, outcome)
     VALUES ($1, $2, $3, $4)`,
    [input.sessionId, input.decisionType, input.confidence, input.outcome]
  );
}
