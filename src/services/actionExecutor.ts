import { MayaAction } from "../types/actions";
import { handleBooking } from "./bookingEngine";
import { getMayaSettings } from "./mayaSettingsService";
import {
  getPipelineSummary,
  getApplicationsByStatus
} from "./staffDataAccess";
import { triggerOutboundCall } from "./outboundIntelligence";

export async function executeAction(
  action: MayaAction,
  context: any
) {
  const settings = await getMayaSettings();

  if (settings.autonomy_level === 0) {
    return {
      success: false,
      message: "Action execution is currently disabled."
    };
  }

  if (action.type === "book" && !settings.allow_booking) {
    return {
      success: false,
      message: "Booking is currently disabled."
    };
  }

  if (action.type === "transfer" && !settings.allow_transfer) {
    return {
      success: false,
      message: "Transfer is currently disabled."
    };
  }

  if (settings.autonomy_level >= 4) {
    if (action.type === "book" && settings.allow_booking) {
      context.confirmed = true;
    }

    if (action.type === "transfer" && settings.allow_transfer) {
      const leadValue = Number(
        context.requestedAmount ?? context.leadValue ?? 0
      );

      if (leadValue >= settings.high_value_threshold) {
        context.immediateTransfer = true;
      }
    }
  }

  if (
    settings.require_confirmation &&
    action.requiresConfirmation &&
    !context.confirmed
  ) {
    return {
      success: false,
      message: "Confirmation required."
    };
  }

  if (
    settings.auto_outbound_enabled &&
    context.lead?.score > 75 &&
    context.lead?.phone
  ) {
    triggerOutboundCall(context.lead.phone);
  }

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
        message: context.immediateTransfer
          ? "High-value lead detected. Connecting you to a Boreal specialist now."
          : "Connecting you to a Boreal specialist now."
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
