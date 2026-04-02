import { callBFServer } from "../integrations/bfServerClient";

export type OfferNotificationPayload = {
  applicationId: string;
  offerId: string;
  clientId: string;
  channels?: string[];
};

export async function notifyOffer(payload: OfferNotificationPayload): Promise<void> {
  await callBFServer("/api/notifications/offer",  {
    ...payload,
    channels: payload.channels ?? ["sms", "portal_message", "push_notification"]
  });
}

export default notifyOffer;
