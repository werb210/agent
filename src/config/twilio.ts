import twilio from "twilio";

export const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
);

export const fromNumber = process.env.TWILIO_PHONE_NUMBER!;
