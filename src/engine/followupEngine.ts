import Twilio from "twilio";

export async function sendFollowUp(to: string) {
  const client = Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to,
    body: "Just checking in — still looking for funding? I can move this forward today."
  });
}

export function scheduleFollowUp(to: string, delayMs = 1000 * 60 * 60 * 24) {
  setTimeout(() => {
    void sendFollowUp(to);
  }, delayMs);
}
