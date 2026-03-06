export type MessageNotificationPayload = {
  messageId: string;
  applicationId: string;
  clientId: string;
};

export async function notifyMessage(payload: MessageNotificationPayload): Promise<void> {
  const apiBase = process.env.BF_SERVER_API;
  if (!apiBase) {
    throw new Error("BF_SERVER_API missing");
  }

  const response = await fetch(`${apiBase}/api/notifications/message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.MAYA_SECRET ?? ""}`
    },
    body: JSON.stringify({
      ...payload,
      channels: ["portal_notification", "browser_push"]
    })
  });

  if (!response.ok) {
    throw new Error(`messageNotification.ts failed: ${response.status}`);
  }
}
