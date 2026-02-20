export function simulateApprovalProbability(score: number, lenderCount: number) {
  let base = score / 100;

  if (lenderCount >= 3) base += 0.1;
  if (lenderCount === 0) base -= 0.2;

  if (base > 0.95) base = 0.95;
  if (base < 0.05) base = 0.05;

  return Number(base.toFixed(2));
}
