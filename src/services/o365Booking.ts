import axios from "axios";
import { AppError } from "../errors/AppError";

export async function createO365Booking(startISO: string, endISO: string, subject: string) {
  if (!process.env.O365_TOKEN) {
    throw new AppError("internal_error", 500, "O365 token missing");
  }

  const { data } = await axios.post(
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

  return data;
}
