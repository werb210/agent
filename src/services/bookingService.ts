import axios from "axios";
import { getGraphToken } from "./msAuth";

const GRAPH_BASE = "https://graph.microsoft.com/v1.0";

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
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data.value[0].availabilityView;
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
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;
}
