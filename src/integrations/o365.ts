import fetch from "node-fetch";

export async function createO365Event(startISO: string, endISO: string, subject: string) {
  if (!process.env.O365_TOKEN) return;

  await fetch("https://graph.microsoft.com/v1.0/me/events", {
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
  });
}
