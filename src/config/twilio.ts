import Twilio from "twilio";

let client: ReturnType<typeof Twilio> | null = null;

export function getTwilioClient() {
  if (client) return client;

  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("Twilio disabled in development mode");
      return {} as any;
    }

    throw new Error("Twilio credentials missing");
  }

  client = Twilio(sid, token);
  return client;
}
