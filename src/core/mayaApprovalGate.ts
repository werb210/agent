import { pool } from "../db";
import { logMayaAction } from "../services/mayaActionLedger";
import { detectPII } from "../compliance/piiDetection";
import { flagSessionCompliance } from "../compliance/complianceFlag";

const highRiskActions = [
  "launch_campaign",
  "increase_budget",
  "mass_notification"
];

export async function requireApproval(actionType: string, payload: unknown) {
  const payloadRecord = typeof payload === "object" && payload !== null
    ? payload as Record<string, unknown>
    : {};
  const piiFields = detectPII(payloadRecord);
  const payloadWithCompliance = piiFields.length
    ? { ...payloadRecord, pii_fields: piiFields }
    : payload;

  if (piiFields.length) {
    await flagSessionCompliance(String(payloadRecord.session_id ?? ""));
  }

  if (!highRiskActions.includes(actionType)) return true;

  const record = await pool.query<{ id: string }>(
    `INSERT INTO maya_action_approvals (action_type, payload)
     VALUES ($1,$2) RETURNING id`,
    [actionType, payloadWithCompliance]
  );

  await logMayaAction(actionType, payloadWithCompliance, "pending_approval");

  throw new Error(
    `Action ${actionType} requires approval. Approval ID: ${record.rows[0].id}`
  );
}
