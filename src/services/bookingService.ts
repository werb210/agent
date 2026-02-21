import axios from "axios";
import { getGraphToken } from "./msAuth";
import { pool } from "../db";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

export async function getActiveStaff() {
  const result = await pool.query(
    `SELECT * FROM staff_calendar WHERE is_active = true`
  );
  return result.rows;
}

export async function checkAvailability(
  email: string,
  startISO: string,
  endISO: string,
  timezone: string
) {
  const token = await getGraphToken();

  const response = await axios.post(
    `${GRAPH_BASE}/users/${email}/calendar/getSchedule`,
    {
      schedules: [email],
      startTime: { dateTime: startISO, timeZone: timezone },
      endTime: { dateTime: endISO, timeZone: timezone },
      availabilityViewInterval: 30
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data.value[0].availabilityView;
}

export async function findNextAvailableSlot(preferredISO: string) {
  const staff = await getActiveStaff();

  for (const member of staff) {
    const duration = member.call_duration_minutes;
    const start = new Date(preferredISO);
    const end = new Date(start.getTime() + duration * 60000);

    const availability = await checkAvailability(
      member.email,
      start.toISOString(),
      end.toISOString(),
      member.timezone
    );

    if (availability.includes("0")) {
      return {
        staff: member,
        startISO: start.toISOString(),
        endISO: end.toISOString()
      };
    }
  }

  return null;
}

export async function createCalendarEvent(
  email: string,
  startISO: string,
  endISO: string,
  timezone: string,
  clientEmail: string
) {
  const token = await getGraphToken();

  const response = await axios.post(
    `${GRAPH_BASE}/users/${email}/events`,
    {
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
    },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  );

  return response.data;
}
