import fetch from "node-fetch";

export async function checkO365Availability(
  startISO: string,
  endISO: string
): Promise<boolean> {

  if (!process.env.O365_TOKEN) {
    console.warn("No O365 token configured");
    return false;
  }

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/calendar/getSchedule",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.O365_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        schedules: ["me"],
        startTime: { dateTime: startISO, timeZone: "America/Toronto" },
        endTime: { dateTime: endISO, timeZone: "America/Toronto" },
        availabilityViewInterval: 30
      })
    }
  );

  const data = await response.json();

  if (!data.value?.length) return false;

  const availability = data.value[0].availabilityView;

  // If availability string contains only 0s, slot is free
  return /^0+$/.test(availability);
}
