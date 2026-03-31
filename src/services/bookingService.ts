import { getGraphToken } from "./msAuth";
import { pool } from "../db";
import twilio from "twilio";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

function getTwilioClient() {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;

  if (!sid || !token) {
    throw new Error("Twilio credentials are not configured");
  }

  return twilio(sid, token);
}

export async function getActiveStaffSorted() {
  const result = await pool.request(`
    SELECT *
    FROM staff_calendar
    WHERE is_active = true
    ORDER BY is_on_call DESC,
             priority_weight DESC,
             last_assigned_at ASC NULLS FIRST
  `);
  return result.rows;
}

export async function checkAvailability(
  email: string,
  startISO: string,
  endISO: string,
  timezone: string
) {
  const token = await getGraphToken();

  const response = await fetch(
    `${GRAPH_BASE}/users/${email}/calendar/getSchedule`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        schedules: [email],
        startTime: { dateTime: startISO, timeZone: timezone },
        endTime: { dateTime: endISO, timeZone: timezone },
        availabilityViewInterval: 30
      })
    }
  );

  if (!response.ok) {
    throw new Error(`Availability check failed: ${response.status}`);
  }

  const data = (await response.json()) as { value: Array<{ availabilityView: string }> };
  return data.value[0].availabilityView;
}

export async function findTopAvailableSlots(
  preferredISO: string,
  slotCount = 3
) {
  const staffList = await getActiveStaffSorted();
  const suggestions: any[] = [];

  for (const staff of staffList) {
    const duration = staff.call_duration_minutes;
    let start = new Date(preferredISO);

    for (let i = 0; i < 8; i++) {
      const end = new Date(start.getTime() + duration * 60000);

      const availability = await checkAvailability(
        staff.email,
        start.toISOString(),
        end.toISOString(),
        staff.timezone
      );

      if (availability.includes("0")) {
        suggestions.push({
          staff,
          startISO: start.toISOString(),
          endISO: end.toISOString()
        });

        if (suggestions.length >= slotCount) {
          return suggestions;
        }
      }

      start = new Date(start.getTime() + 30 * 60000);
    }
  }

  return suggestions;
}

export async function createCalendarEvent(
  email: string,
  startISO: string,
  endISO: string,
  timezone: string,
  clientEmail: string
) {
  const token = await getGraphToken();

  const response = await fetch(`${GRAPH_BASE}/users/${email}/events`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      subject: "Boreal Strategy Call",
      start: { dateTime: startISO, timeZone: timezone },
      end: { dateTime: endISO, timeZone: timezone },
      attendees: [
        {
          emailAddress: {
            address: clientEmail,
            name: "Client"
          },
          type: "required"
        }
      ],
      isOnlineMeeting: true,
      onlineMeetingProvider: "teamsForBusiness"
    })
  });

  if (!response.ok) {
    throw new Error(`Create event failed: ${response.status}`);
  }

  return response.json();
}

export async function confirmBookingSMS(
  phone: string,
  staffEmail: string,
  startISO: string
) {
  const twilioClient = getTwilioClient();

  await twilioClient.messages.create({
    to: phone,
    from: process.env.TWILIO_PHONE_NUMBER!,
    body: `Your call with ${staffEmail} is confirmed for ${new Date(
      startISO
    ).toLocaleString()}. A Teams invite has been sent.`
  });
}
