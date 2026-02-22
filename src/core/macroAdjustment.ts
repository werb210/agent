export function adjustForMacro(probability: number, macroIndex: number) {
  const adjusted = probability * (1 - (macroIndex * 0.2));
  return Math.max(0.05, Math.min(0.95, adjusted));
}
