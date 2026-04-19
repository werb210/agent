import twilio from "twilio";
import { ENV } from "../config/env.js";

export const twilioClient = twilio(
  ENV.TWILIO_ACCOUNT_SID,
  ENV.TWILIO_AUTH_TOKEN
);
