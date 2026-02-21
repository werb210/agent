import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

export async function buildClientContext(sessionId: string) {
  // Example: fetch minimal client data only
  const result = await pool.query(
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
