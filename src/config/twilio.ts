import Twilio from "twilio";
import { AppError } from "../errors/AppError.js";

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

    throw new AppError("internal_error", 500, "Twilio credentials missing");
  }

  client = Twilio(sid, token);
  return client;
}
