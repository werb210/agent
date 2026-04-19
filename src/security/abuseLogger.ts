import { pool } from "../integrations/bfServerClient.js";

export async function logAbuse(ip: string, route: string) {
  await pool.request(
    `INSERT INTO maya_abuse_log (ip_address, route, timestamp)
     VALUES ($1, $2, NOW())`,
    [ip, route]
  );
}
