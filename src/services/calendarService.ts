import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";
import { DateTime } from "luxon";

const TIMEZONE = "America/Edmonton";
const BUSINESS_START = 9;
const BUSINESS_END = 17;
const MEETING_LENGTH_MIN = 30;
const BUFFER_MIN = 30;

const getClient = () => {
  const tokenEndpoint = `https://login.microsoftonline.com/${process.env.O365_TENANT_ID}/oauth2/v2.0/token`;

  return Client.init({
    authProvider: async (done: (error: Error | null, accessToken: string | null) => void) => {
      const res = await fetch(tokenEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.O365_CLIENT_ID!,
          client_secret: process.env.O365_CLIENT_SECRET!,
          scope: "https://graph.microsoft.com/.default",
          grant_type: "client_credentials"
        })
      });

      const data = (await res.json()) as { access_token: string };
      done(null, data.access_token);
    }
  });
};

export const checkAvailability = async (startISO: string, endISO: string) => {
  const client = getClient();

  const response = await client
    .api(`/users/${process.env.O365_USER_EMAIL}/calendarView`)
    .query({
      startDateTime: startISO,
      endDateTime: endISO
    })
    .get();

  return response.value.length === 0;
};

export const enforceBusinessRules = (requestedStartISO: string) => {
  const start = DateTime.fromISO(requestedStartISO).setZone(TIMEZONE);

  if (!start.isValid) return { valid: false };

  if (start < DateTime.now().setZone(TIMEZONE)) {
    return { valid: false };
  }

  if (start.hour < BUSINESS_START || start.hour >= BUSINESS_END) {
    return { valid: false };
  }

  const end = start.plus({ minutes: MEETING_LENGTH_MIN });

  return {
    valid: true,
    startISO: start.toISO(),
    endISO: end.toISO()
  };
};

export const suggestNextAvailableSlot = async (requestedISO: string) => {
  const base = DateTime.fromISO(requestedISO).setZone(TIMEZONE);

  for (let i = 1; i <= 8; i++) {
    const candidate = base.plus({ minutes: i * (MEETING_LENGTH_MIN + BUFFER_MIN) });

    if (candidate.hour >= BUSINESS_START && candidate.hour < BUSINESS_END) {
      const end = candidate.plus({ minutes: MEETING_LENGTH_MIN });

      const free = await checkAvailability(candidate.toISO()!, end.toISO()!);

      if (free) {
        return {
          startISO: candidate.toISO(),
          endISO: end.toISO()
        };
      }
    }
  }

  return null;
};

export const createCalendarEvent = async (startISO: string, endISO: string) => {
  const client = getClient();

  return client.api(`/users/${process.env.O365_USER_EMAIL}/events`).post({
    subject: "Booked Call",
    start: { dateTime: startISO, timeZone: TIMEZONE },
    end: { dateTime: endISO, timeZone: TIMEZONE }
  });
};
