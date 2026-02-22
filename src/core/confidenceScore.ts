export function calculateConfidence(probability: number) {
  return 1 - Math.abs(probability - 0.5) * 2;
}
