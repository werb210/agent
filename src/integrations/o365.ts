const nativeFetch = globalThis.fetch;

export async function createO365Event(startISO: string, endISO: string, subject: string) {
  if (!process.env.O365_TOKEN) return;

  await nativeFetch("https://graph.microsoft.com/v1.0/me/events", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.O365_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      subject,
      start: { dateTime: startISO, timeZone: "America/Toronto" },
      end: { dateTime: endISO, timeZone: "America/Toronto" },
    }),
  });
}

export interface O365EmailParams {
  accessToken: string;
  fromEmail?: string;
  to: string;
  subject: string;
  bodyHtml: string;
  replyTo?: string;
  saveToSentItems?: boolean;
}

export async function sendO365Email(params: O365EmailParams): Promise<boolean> {
  const endpoint = params.fromEmail
    ? `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(params.fromEmail)}/sendMail`
    : "https://graph.microsoft.com/v1.0/me/sendMail";

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      message: {
        subject: params.subject,
        body: {
          contentType: "HTML",
          content: params.bodyHtml,
        },
        toRecipients: [{ emailAddress: { address: params.to } }],
        ...(params.replyTo ? { replyTo: [{ emailAddress: { address: params.replyTo } }] } : {}),
      },
      saveToSentItems: params.saveToSentItems ?? true,
    }),
  });

  return response.ok || response.status === 202;
}

export async function getO365AccessToken(_userEmail?: string): Promise<string> {
  const tenantId = process.env.O365_TENANT_ID ?? process.env.MS_TENANT_ID;
  const clientId = process.env.O365_CLIENT_ID ?? process.env.MS_CLIENT_ID;
  const clientSecret = process.env.O365_CLIENT_SECRET ?? process.env.MS_CLIENT_SECRET;

  if (!tenantId || !clientId || !clientSecret) {
    throw new Error("O365 credentials not configured (O365_TENANT_ID, O365_CLIENT_ID, O365_CLIENT_SECRET)");
  }

  const response = await fetch(`https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: clientId,
      client_secret: clientSecret,
      scope: "https://graph.microsoft.com/.default",
    }),
  });

  if (!response.ok) {
    throw new Error(`O365 token request failed: ${response.status}`);
  }

  const data = (await response.json()) as { access_token: string };
  return data.access_token;
}

export async function listO365Emails(params: {
  accessToken: string;
  mailbox?: string;
  folder?: string;
  top?: number;
}): Promise<any[]> {
  const mailbox = params.mailbox ? `users/${encodeURIComponent(params.mailbox)}` : "me";
  const folder = params.folder ?? "Inbox";
  const top = params.top ?? 20;

  const response = await fetch(
    `https://graph.microsoft.com/v1.0/${mailbox}/mailFolders/${folder}/messages?$top=${top}&$orderby=receivedDateTime desc`,
    {
      headers: { Authorization: `Bearer ${params.accessToken}` },
    },
  );

  if (!response.ok) return [];
  const data = (await response.json()) as { value: any[] };
  return data.value ?? [];
}
