import { pool } from "../db/index";

export async function logDecision(type: string, input: any, output: any, explanation: string) {
  await pool.request(
    "INSERT INTO maya_decision_log (decision_type, input_data, output_data, explanation) VALUES ($1,$2,$3,$4)",
    [type, input, output, explanation]
  );
}
