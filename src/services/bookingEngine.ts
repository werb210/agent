import { logger } from "../logging/logger";
import { createO365Booking } from "./o365Booking";
import { checkO365Availability } from "./o365Availability";
import { sendSMS } from "./smsService";

interface BookingParams {
  startISO: string;
  endISO: string;
  phone?: string;
}

export async function handleBooking(params: BookingParams) {

  const available = await checkO365Availability(
    params.startISO,
    params.endISO
  );

  if (!available) {
    logger.info("Booking conflict detected", {
      startISO: params.startISO,
      endISO: params.endISO
    });

    return {
      success: false,
      message: "That time is unavailable. Please select another slot."
    };
  }

  await createO365Booking(
    params.startISO,
    params.endISO,
    "Boreal Strategy Call"
  );

  if (params.phone) {
    await sendSMS(
      params.phone,
      "Your Boreal strategy call has been booked successfully."
    );
  }

  logger.info("Booking confirmed", {
    startISO: params.startISO,
    endISO: params.endISO,
    smsSent: Boolean(params.phone)
  });

  return {
    success: true,
    message: "Booking confirmed."
  };
}
