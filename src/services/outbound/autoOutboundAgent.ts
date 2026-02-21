import { triggerOutboundCall } from "../twilioService";
import { pool } from "../../db";

export async function autoOutboundHighValueLeads() {
  const leads = await pool.query(
    "SELECT id, phone, deal_value FROM leads WHERE contacted = false AND deal_value > 250000"
  );

  for (const lead of leads.rows) {
    await triggerOutboundCall(lead.phone);
    await pool.query(
      "UPDATE leads SET contacted = true WHERE id = $1",
      [lead.id]
    );
  }
}
