export type AutonomyLevel = "A" | "B" | "C" | "D" | "E";

export const CURRENT_AUTONOMY_LEVEL: AutonomyLevel =
  (process.env.AUTONOMY_LEVEL as AutonomyLevel) || "A";

export function canExecute(required: AutonomyLevel): boolean {
  const order: AutonomyLevel[] = ["A", "B", "C", "D", "E"];
  return order.indexOf(CURRENT_AUTONOMY_LEVEL) >= order.indexOf(required);
}
