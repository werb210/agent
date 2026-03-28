import { bfServerRequest } from "../integrations/bfServerClient";

export type MessageNotificationPayload = {
  messageId: string;
  applicationId: string;
  clientId: string;
};

export async function notifyMessage(payload: MessageNotificationPayload): Promise<void> {
  await bfServerRequest("/api/notifications/message", "POST", {
    ...payload,
    channels: ["portal_notification", "browser_push"]
  });
}

export default notifyMessage;
