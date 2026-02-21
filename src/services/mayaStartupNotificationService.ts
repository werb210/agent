import twilio from "twilio";
import { logAudit } from "../infrastructure/mayaAudit";

type StartupNotificationContact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendStartupNotification(contact: StartupNotificationContact): Promise<void> {
  const message = `
Good news ${contact.name || ""} —

Startup funding is now available.

Reply START to begin your application.
`;

  if (contact.phone) {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: contact.phone
    });
  }

  if (contact.email) {
    console.log(`Email sent to ${contact.email}`);
  }

  await logAudit("maya", "startup_notification_sent", {
    contact_id: contact.id
  });
}
