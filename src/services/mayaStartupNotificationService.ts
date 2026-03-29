import twilio from "twilio";
import { logAudit } from "../infrastructure/mayaAudit";
import { enforceKillSwitch } from "../core/mayaSafety";
import { logger } from "../infrastructure/logger";

type StartupNotificationContact = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
};

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("Twilio credentials are not configured");
  }

  return twilio(sid, token);
}

export async function sendStartupNotification(contact: StartupNotificationContact): Promise<void> {
  enforceKillSwitch();
  const message = `
Good news ${contact.name || ""} —

Startup funding is now available.

Reply START to begin your application.
`;

  if (contact.phone) {
    const client = getTwilioClient();

    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: contact.phone
    });
  }

  if (contact.email) {
    logger.info("Email sent", { email: contact.email });
  }

  await logAudit("maya", "startup_notification_sent", {
    contact_id: contact.id
  });
}
