import axios from "axios";

export async function checkO365Availability(
  startISO: string,
  endISO: string
): Promise<boolean> {
  if (!process.env.O365_TOKEN) {
    console.warn("No O365 token configured");
    return false;
  }

  const { data } = await axios.post(
    "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
    {
      schedules: ["me"],
      startTime: { dateTime: startISO, timeZone: "America/Toronto" },
      endTime: { dateTime: endISO, timeZone: "America/Toronto" },
      availabilityViewInterval: 30
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.O365_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );

  if (!data.value?.length) return false;
  return /^0+$/.test(data.value[0].availabilityView);
}
