import { pool } from "../db";

export async function logMayaAction(actionType: string, payload: unknown, status = "executed") {
  await pool.query(
    `INSERT INTO maya_action_ledger (action_type, payload, status)
     VALUES ($1,$2,$3)`,
    [actionType, payload, status]
  );
}

