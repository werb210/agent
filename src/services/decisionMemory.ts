import { pool } from "../integrations/bfServerClient";


interface DecisionMemoryInput {
  sessionId: string;
  decisionType: string;
  confidence: number;
  outcome: string;
}

export async function logDecisionMemory(input: DecisionMemoryInput) {
  await pool.request(
    `INSERT INTO maya_decisions (session_id, decision_type, confidence, outcome)
     VALUES ($1, $2, $3, $4)`,
    [input.sessionId, input.decisionType, input.confidence, input.outcome]
  );
}
