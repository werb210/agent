export type OfferNotificationPayload = {
  applicationId: string;
  offerId: string;
  clientId: string;
  channels?: string[];
};

export async function notifyOffer(payload: OfferNotificationPayload): Promise<void> {
  const apiBase = process.env.BF_SERVER_API;
  if (!apiBase) {
    throw new Error("BF_SERVER_API missing");
  }

  const response = await fetch(`${apiBase}/api/notifications/offer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAYA_SECRET ?? ""}`
    },
    body: JSON.stringify({
      ...payload,
      channels: payload.channels ?? ["sms", "portal_message", "push_notification"]
    })
  });

  if (!response.ok) {
    throw new Error(`offerNotification.ts failed: ${response.status}`);
  }
}
