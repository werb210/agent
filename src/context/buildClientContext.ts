import { pool } from "../db";


export async function buildClientContext(sessionId: string) {
  // Example: fetch minimal client data only
  const result = await pool.request(
    `SELECT id, first_name, last_name, status, funding_amount 
     FROM clients 
     WHERE session_id = $1`,
    [sessionId]
  );

  if (!result.rows.length) {
    return null;
  }

  const client = result.rows[0];

  return {
    clientId: client.id,
    name: `${client.first_name}`,
    status: client.status,
    fundingAmount: client.funding_amount
  };
}
