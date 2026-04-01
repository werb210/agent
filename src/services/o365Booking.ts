import { AppError } from "../errors/AppError";

const nativeFetch = globalThis["fetch"];
export async function createO365Booking(startISO: string, endISO: string, subject: string) {
  if (!process.env.O365_TOKEN) {
    throw new AppError("internal_error", 500, "O365 token missing");
  }

  const response = await nativeFetch("https://graph.microsoft.com/v1.0/me/events", {
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

  if (!response.ok) {
    throw new AppError("upstream_error", response.status, "Failed to create O365 event");
  }

  return response.json();
}
