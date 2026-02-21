import { MayaAction } from "../types/actions";
import { handleBooking } from "./bookingEngine";

export async function executeAction(
  action: MayaAction,
  context: any
) {

  switch (action.type) {

    case "book":
      if (!context.startISO || !context.endISO) {
        return {
          success: false,
          message: "Please provide a valid time to book."
        };
      }

      return await handleBooking({
        startISO: context.startISO,
        endISO: context.endISO,
        phone: context.phone
      });

    case "transfer":
      return {
        success: true,
        message: "Connecting you to a Boreal specialist now."
      };

    case "follow_up":
      return {
        success: true,
        message: "Follow-up scheduled."
      };

    default:
      return {
        success: true,
        message: "No action executed."
      };
  }
}
