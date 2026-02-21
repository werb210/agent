export function getDynamicEscalationThreshold(
  bookingConversionRate: number
) {
  if (bookingConversionRate > 0.6) {
    return 0.35;
  }

  if (bookingConversionRate < 0.3) {
    return 0.6;
  }

  return 0.45;
}
