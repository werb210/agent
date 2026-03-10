import axios from "axios";

export async function createO365Event(startISO: string, endISO: string, subject: string) {
  if (!process.env.O365_TOKEN) return;

  await axios.post(
    "https://graph.microsoft.com/v1.0/me/events",
    {
      subject,
      start: { dateTime: startISO, timeZone: "America/Toronto" },
      end: { dateTime: endISO, timeZone: "America/Toronto" }
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.O365_TOKEN}`,
        "Content-Type": "application/json"
      }
    }
  );
}
