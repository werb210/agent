import { pool } from "../integrations/bfServerClient.js";

export async function pushDeadLetter(entry: {
  type: string;
  data: unknown;
  error: string;
}) {
  await pool.query(
    `
    INSERT INTO maya_dead_letter (job_type, payload, error)
    VALUES ($1, $2, $3)
    `,
    [entry.type, JSON.stringify(entry.data), entry.error]
  );
}
