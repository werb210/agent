import { pool } from "../db";

export async function logDecision(type: string, input: any, output: any, explanation: string) {
  await pool.query(
    "INSERT INTO maya_decision_log (decision_type, input_data, output_data, explanation) VALUES ($1,$2,$3,$4)",
    [type, input, output, explanation]
  );
}
