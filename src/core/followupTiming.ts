export function optimalFollowupTime(probability: number) {
  if (probability > 0.8) return "within_1_hour";
  if (probability > 0.6) return "within_24_hours";
  return "3_days";
}
