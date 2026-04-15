import { callBFServer } from "../../integrations/bfServerClient";

export async function exportTrainingDataset() {
  const contacts = await callBFServer<any>("/api/crm/contacts");
  if (Array.isArray(contacts)) {
    return contacts;
  }
  if (Array.isArray(contacts?.rows)) {
    return contacts.rows;
  }
  if (Array.isArray(contacts?.contacts)) {
    return contacts.contacts;
  }
  return [];
}

export async function recordModelVersion(version: string, accuracy: number) {
  await callBFServer("/api/crm/events", {
    eventType: "model_version_recorded",
    version,
    accuracy,
    recordedAt: new Date().toISOString(),
  });
}
