import Twilio from "twilio";

export function shouldEscalate(score: number, fundingAmount?: number) {
  if (score >= 75) return true;
  if (fundingAmount && fundingAmount >= 250000) return true;
  return false;
}

export async function notifyStaffIfHot(session: any) {
  if (!session.hotLead) return;

  const client = Twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  await client.messages.create({
    from: process.env.TWILIO_PHONE_NUMBER!,
    to: process.env.STAFF_NOTIFICATION_NUMBER!,
    body: `🔥 HOT LEAD\nScore: ${session.scoring.score}\nProduct: ${session.product}`
  });
}
