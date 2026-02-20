export function shouldEscalate(score: number, fundingAmount?: number) {
  if (score >= 75) return true;
  if (fundingAmount && fundingAmount >= 250000) return true;
  return false;
}
