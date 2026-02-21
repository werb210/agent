import fetch from "node-fetch";

export async function createO365Booking(
  startISO: string,
  endISO: string,
  subject: string
) {

  if (!process.env.O365_TOKEN) {
    throw new Error("O365 token missing");
  }

  const response = await fetch(
    "https://graph.microsoft.com/v1.0/me/events",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.O365_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        subject,
        start: { dateTime: startISO, timeZone: "America/Toronto" },
        end: { dateTime: endISO, timeZone: "America/Toronto" }
      })
    }
  );

  return response.json();
}
