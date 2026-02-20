import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

const getClient = () => {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.O365_TENANT_ID}/oauth2/v2.0/token`;

  return Client.init({
    authProvider: async (done: (error: Error | null, accessToken: string | null) => void) => {
      try {
        const res = await fetch(tokenEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: process.env.O365_CLIENT_ID || "",
            client_secret: process.env.O365_CLIENT_SECRET || "",
            scope: "https://graph.microsoft.com/.default",
            grant_type: "client_credentials"
          })
        });

        const data = (await res.json()) as { access_token?: string };
        done(null, data.access_token || null);
      } catch (error) {
        done(error as Error, null);
      }
    }
  });
};

export const createCalendarEvent = async (startISO: string, endISO: string) => {
  const client = getClient();

  return client.api(`/users/${process.env.O365_USER_EMAIL}/events`).post({
    subject: "Booked Call",
    start: { dateTime: startISO, timeZone: "America/Edmonton" },
    end: { dateTime: endISO, timeZone: "America/Edmonton" }
  });
};
