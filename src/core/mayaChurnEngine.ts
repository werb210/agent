import { pool } from "../db";

export async function predictChurn(): Promise<void> {
  const clients = await pool.query<{ contact_id: string; last_activity: Date | string }>(
    `SELECT contact_id,
            MAX(created_at) AS last_activity
     FROM notes
     GROUP BY contact_id`
  );

  const now = new Date();

  for (const client of clients.rows) {
    const lastActivity = new Date(client.last_activity);
    const daysInactive = (now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);

    if (daysInactive > 30) {
      console.log("Potential churn risk:", client.contact_id);
    }
  }
}
