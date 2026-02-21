import Twilio from "twilio";

const client = process.env.TWILIO_SID && process.env.TWILIO_AUTH
  ? Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH)
  : null;

export async function sendSMS(to: string, body: string) {
  if (!client || !process.env.TWILIO_NUMBER) return;

  await client.messages.create({
    from: process.env.TWILIO_NUMBER,
    to,
    body
  });
}
