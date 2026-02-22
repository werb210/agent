import { pool } from "../db";
import { storeEmbedding } from "./mayaEmbeddingEngine";
import { encryptPIIFields } from "../compliance/piiCrypto";

export async function captureStartupLead(data: {
  name: string;
  email: string;
  phone: string;
}) {
  const encrypted = encryptPIIFields(data);

  const existing = await pool.query(
    `SELECT id FROM crm_contacts WHERE email = $1 OR phone = $2`,
    [encrypted.email, encrypted.phone]
  );

  let contactId: string;

  if (existing.rows.length) {
    contactId = existing.rows[0].id;
  } else {
    const insert = await pool.query(
      `INSERT INTO crm_contacts (name, email, phone)
       VALUES ($1,$2,$3)
       RETURNING id`,
      [data.name, encrypted.email, encrypted.phone]
    );

    contactId = insert.rows[0].id;
  }

  await pool.query(
    `INSERT INTO crm_tags (contact_id, tag)
     VALUES ($1,'startup_interest')
     ON CONFLICT DO NOTHING`,
    [contactId]
  );

  await storeEmbedding(
    "contact",
    contactId,
    `Startup funding interest. Name: ${data.name}, Email: ${data.email}`
  );

  return { success: true };
}
