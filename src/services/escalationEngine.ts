import { getAvailableStaff } from "./staffAvailability";
import { getMayaSettings } from "./mayaSettingsService";

interface EscalationResult {
  shouldEscalate: boolean;
  transferTo?: string;
  fallbackBooking: boolean;
}

export async function evaluateEscalation(
  escalatedFlag: boolean
): Promise<EscalationResult> {
  if (!escalatedFlag) {
    return {
      shouldEscalate: false,
      fallbackBooking: false
    };
  }

  const settings = await getMayaSettings();

  if (settings.autonomy_level < 2) {
    return {
      shouldEscalate: true,
      fallbackBooking: true
    };
  }

  const available = await getAvailableStaff();

  if (available.length > 0) {
    return {
      shouldEscalate: true,
      transferTo: available[0], // Later: routing logic
      fallbackBooking: false
    };
  }

  return {
    shouldEscalate: true,
    fallbackBooking: true
  };
}
