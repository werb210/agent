import { MayaAction } from "../types/actions";
import { handleBooking } from "./bookingEngine";
import {
  getPipelineSummary,
  getApplicationsByStatus
} from "./staffDataAccess";

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

    case "staff_pipeline_summary": {
      if (context.mode !== "staff") {
        return {
          success: false,
          message: "I can’t share internal pipeline data in client mode."
        };
      }

      const summary = await getPipelineSummary();
      return {
        success: true,
        message: summary
      };
    }

    case "staff_applications_by_status": {
      if (context.mode !== "staff") {
        return {
          success: false,
          message: "I can’t share internal pipeline data in client mode."
        };
      }

      const status = context.status ?? action.payload?.status;

      if (!status) {
        return {
          success: false,
          message: "Please provide a valid status."
        };
      }

      const apps = await getApplicationsByStatus(status);
      return {
        success: true,
        message: apps
      };
    }

    default:
      return {
        success: true,
        message: "No action executed."
      };
  }
}
