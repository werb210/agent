import { pool } from "../db";

export type FullClientContext = {
  contact: Record<string, unknown>;
  applications: Record<string, unknown>[];
  documents: Record<string, unknown>[];
  notes: Record<string, unknown>[];
};

export async function loadFullClientContext(phone: string): Promise<FullClientContext | null> {
  const client = await pool.query(
    "SELECT * FROM crm_contacts WHERE phone = $1 LIMIT 1",
    [phone]
  );

  if (!client.rows.length) {
    return null;
  }

  const contact = client.rows[0] as Record<string, unknown>;
  const contactId = contact.id as string | number;

  const applications = await pool.query(
    "SELECT * FROM applications WHERE contact_id = $1",
    [contactId]
  );

  const documents = await pool.query(
    "SELECT * FROM documents WHERE contact_id = $1",
    [contactId]
  );

  const notes = await pool.query(
    "SELECT * FROM notes WHERE contact_id = $1",
    [contactId]
  );

  return {
    contact,
    applications: applications.rows as Record<string, unknown>[],
    documents: documents.rows as Record<string, unknown>[],
    notes: notes.rows as Record<string, unknown>[]
  };
}

export async function storeConversationMemory(sessionId: string, data: unknown): Promise<void> {
  await pool.query(
    "UPDATE sessions SET data = $1 WHERE id = $2",
    [data, sessionId]
  );
}
