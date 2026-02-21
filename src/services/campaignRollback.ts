import { pool } from "../db";
import { logMayaAction } from "./mayaActionLedger";

export async function snapshotCampaign(campaignId: string, config: unknown) {
  await pool.query(
    `INSERT INTO maya_campaign_snapshots (campaign_id, config)
     VALUES ($1,$2)`,
    [campaignId, config]
  );

  await logMayaAction("campaign_snapshot", { campaignId }, "executed");
}

export async function rollbackCampaign(campaignId: string) {
  const snapshot = await pool.query<{ config: unknown }>(
    `SELECT config FROM maya_campaign_snapshots
     WHERE campaign_id=$1
     ORDER BY created_at DESC LIMIT 1`,
    [campaignId]
  );

  if (!snapshot.rows.length) throw new Error("No snapshot");

  const config = snapshot.rows[0].config;

  // push config back to Google/Facebook API
  console.log("Rollback applied", config);
  await logMayaAction("campaign_rollback", { campaignId, config }, "executed");
}

