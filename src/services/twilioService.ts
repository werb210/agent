import Twilio from "twilio";

function getClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("Twilio credentials are not configured");
  }

  return Twilio(sid, token);
}

export const sendSMS = async (to: string, body: string) => {
  const client = getClient();

  return client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER || "",
    to,
    body
  });
};

export const triggerOutboundCall = async (to: string) => {
  const client = getClient();

  return client.calls.create({
    from: process.env.TWILIO_PHONE_NUMBER || "",
    to,
    url: `${process.env.AGENT_URL || ""}/voice`
  });
};
