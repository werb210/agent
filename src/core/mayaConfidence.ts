export function calculateConfidence(response: string) {
  const lengthScore = Math.min(response.length / 500, 1);
  const structureScore = response.includes("\n") ? 0.2 : 0;
  return Math.min(lengthScore + structureScore, 0.95);
}
