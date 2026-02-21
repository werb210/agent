import { pool } from "../../db";
import { triggerOutboundCall } from "../twilioService";
import { logDecision } from "../complianceLogger";

export async function runOutboundCampaign(campaignId: string) {

  const leads = await pool.query(
    "SELECT * FROM maya_outbound_queue WHERE campaign_id = $1 AND status = 'pending' LIMIT 25",
    [campaignId]
  );

  for (const lead of leads.rows) {

    await triggerOutboundCall(lead.phone);

    await pool.query(
      "UPDATE maya_outbound_queue SET status = 'called' WHERE id = $1",
      [lead.id]
    );

    await logDecision(
      "outbound_call",
      { phone: lead.phone, campaignId },
      { status: "called" },
      "Outbound call triggered by Admin campaign upload"
    );
  }

  return leads.rows.length;
}
