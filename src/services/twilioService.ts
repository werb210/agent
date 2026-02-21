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

export const triggerOutboundCall = async (to: string) => {
  return client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER || "",
    to,
    url: `${process.env.AGENT_URL || ""}/voice`
  });
};
