import Twilio from "twilio";

const client = Twilio(
  process.env.TWILIO_ACCOUNT_SID || "",
  process.env.TWILIO_AUTH_TOKEN || ""
);

export const sendSMS = async (to: string, body: string) => {
  return client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER || "",
    to,
    body
  });
};
