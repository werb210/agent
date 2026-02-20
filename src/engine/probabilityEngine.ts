export function calculateApprovalProbability(score: number) {
  if (score >= 85) return 0.88;
  if (score >= 70) return 0.72;
  if (score >= 55) return 0.55;
  if (score >= 40) return 0.32;
  return 0.15;
}
