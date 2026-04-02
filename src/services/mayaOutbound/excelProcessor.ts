import ExcelJS from "exceljs";
import { pool } from "../../db";
import { randomUUID } from "node:crypto";

export async function processExcel(filePath: string, campaignName: string) {

  const campaignId = randomUUID();

  await pool.request(
    "INSERT INTO maya_campaigns (id, name) VALUES ($1,$2)",
    [campaignId, campaignName]
  );

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const sheet = workbook.worksheets[0];

  if (!sheet) {
    return { inserted: 0, campaignId };
  }

  const headerCells = sheet.getRow(1).values as Array<string | undefined>;
  const headers = headerCells
    .slice(1)
    .map((header) => String(header ?? "").trim());

  const rows: Record<string, string>[] = [];
  for (let rowNumber = 2; rowNumber <= sheet.rowCount; rowNumber++) {
    const row = sheet.getRow(rowNumber);
    const values = row.values as Array<string | number | undefined>;
    const record: Record<string, string> = {};

    for (let col = 1; col <= headers.length; col++) {
      const key = headers[col - 1];
      if (!key) continue;
      const value = values[col];
      record[key] = value == null ? "" : String(value).trim();
    }

    rows.push(record);
  }

  let inserted = 0;

  for (const row of rows) {

    const email = row["Email"];
    const phone = row["Phone"];

    // Duplicate detection in CRM
    const existing = await pool.request(
      "SELECT id FROM contacts WHERE email = $1 OR phone = $2",
      [email, phone]
    );

    if (existing.rows.length > 0) continue;

    // Insert into CRM contacts table
    await pool.request(
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
    await pool.request(
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
