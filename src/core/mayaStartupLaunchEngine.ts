import { pool } from "../db";
import { logAudit } from "../infrastructure/mayaAudit";
import { launchStartupCampaign } from "../services/mayaStartupCampaignService";
import { sendStartupNotification } from "../services/mayaStartupNotificationService";

type StartupProductRow = { id: string };

type WaitingContactRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export async function checkStartupProductLaunch(): Promise<void> {
  const product = await pool.query<StartupProductRow>(`
    SELECT id
    FROM lender_products
    WHERE LOWER(category) LIKE '%startup%'
    AND active = true
    LIMIT 1
  `);

  if (!product.rows.length) {
    return;
  }

  const startupProductId = product.rows[0].id;

  const waitingList = await pool.query<WaitingContactRow>(`
    SELECT id, name, email, phone
    FROM crm_contacts
    WHERE id IN (
      SELECT contact_id FROM crm_tags WHERE tag = 'startup_interest'
    )
    AND startup_notified = false
  `);

  if (!waitingList.rows.length) {
    return;
  }

  let notifiedCount = 0;

  for (const contact of waitingList.rows) {
    await sendStartupNotification(contact);
    await pool.query(
      `
      UPDATE crm_contacts
      SET startup_notified = true
      WHERE id = $1
    `,
      [contact.id]
    );

    notifiedCount++;
  }

  await launchStartupCampaign();

  await pool.query(
    `
    INSERT INTO maya_startup_launch_log (product_id, total_notified)
    VALUES ($1,$2)
  `,
    [startupProductId, notifiedCount]
  );

  await logAudit("maya", "startup_product_launch", {
    product_id: startupProductId,
    notified: notifiedCount
  });
}
