import * as XLSX from "xlsx";
import { pool } from "../../db";
import { v4 as uuidv4 } from "uuid";

export async function processExcel(filePath: string, campaignName: string) {

  const campaignId = uuidv4();

  await pool.query(
    "INSERT INTO maya_campaigns (id, name) VALUES ($1,$2)",
    [campaignId, campaignName]
  );

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const rows: any[] = XLSX.utils.sheet_to_json(sheet);

  let inserted = 0;

  for (const row of rows) {

    const email = row["Email"];
    const phone = row["Phone"];

    // Duplicate detection in CRM
    const existing = await pool.query(
      "SELECT id FROM contacts WHERE email = $1 OR phone = $2",
      [email, phone]
    );

    if (existing.rows.length > 0) continue;

    // Insert into CRM contacts table
    await pool.query(
      `INSERT INTO contacts
       (company_name, contact_name, role, email, phone)
       VALUES ($1,$2,$3,$4,$5)`,
      [
        row["Company name"],
        row["Contact name"],
        row["Role in company"],
        email,
        phone
      ]
    );

    // Insert into outbound queue
    await pool.query(
      `INSERT INTO maya_outbound_queue
       (campaign_id, company_name, contact_name, role, email, phone)
       VALUES ($1,$2,$3,$4,$5,$6)`,
      [
        campaignId,
        row["Company name"],
        row["Contact name"],
        row["Role in company"],
        email,
        phone
      ]
    );

    inserted++;
  }

  return { inserted, campaignId };
}
