import { callBFServer } from "../integrations/bfServerClient";

export type MessageNotificationPayload = {
  messageId: string;
  applicationId: string;
  clientId: string;
};

export async function notifyMessage(payload: MessageNotificationPayload): Promise<void> {
  await callBFServer("/api/notifications/message",  {
    ...payload,
    channels: ["portal_notification", "browser_push"]
  });
}

export default notifyMessage;
