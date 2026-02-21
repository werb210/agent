import { pool } from "../db";
import { logMayaAction } from "../services/mayaActionLedger";

const highRiskActions = [
  "launch_campaign",
  "increase_budget",
  "mass_notification"
];

export async function requireApproval(actionType: string, payload: unknown) {
  if (!highRiskActions.includes(actionType)) return true;

  const record = await pool.query<{ id: string }>(
    `INSERT INTO maya_action_approvals (action_type, payload)
     VALUES ($1,$2) RETURNING id`,
    [actionType, payload]
  );

  await logMayaAction(actionType, payload, "pending_approval");

  throw new Error(
    `Action ${actionType} requires approval. Approval ID: ${record.rows[0].id}`
  );
}

