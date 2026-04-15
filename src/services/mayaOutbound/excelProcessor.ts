import ExcelJS from "exceljs";
import { randomUUID } from "node:crypto";
import { callBFServer } from "../../integrations/bfServerClient";

export async function processExcel(filePath: string, campaignName: string) {
  const campaignId = randomUUID();

  await callBFServer("/api/marketing/campaign", {
    campaignId,
    name: campaignName,
    status: "created",
  });

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

  const contactsResponse = await callBFServer<any>("/api/crm/contacts");
  const existingContacts = Array.isArray(contactsResponse)
    ? contactsResponse
    : Array.isArray(contactsResponse?.contacts)
      ? contactsResponse.contacts
      : Array.isArray(contactsResponse?.rows)
        ? contactsResponse.rows
        : [];

  const existingKeys = new Set(
    existingContacts.map((contact: any) => `${contact?.email ?? ""}|${contact?.phone ?? ""}`)
  );

  let inserted = 0;

  for (const row of rows) {
    const email = row["Email"] ?? "";
    const phone = row["Phone"] ?? "";
    const dedupeKey = `${email}|${phone}`;

    if (existingKeys.has(dedupeKey)) continue;

    await callBFServer("/api/crm/events", {
      eventType: "contact_imported",
      campaignId,
      companyName: row["Company name"],
      contactName: row["Contact name"],
      role: row["Role in company"],
      email,
      phone,
    });

    await callBFServer("/api/marketing/campaign", {
      campaignId,
      action: "enqueue_contact",
      companyName: row["Company name"],
      contactName: row["Contact name"],
      role: row["Role in company"],
      email,
      phone,
    });

    existingKeys.add(dedupeKey);
    inserted++;
  }

  return { inserted, campaignId };
}
