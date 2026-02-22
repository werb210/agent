export function generateReasoningSummary(prob: number, contributions: any) {
  const drivers = Object.entries(contributions)
    .sort((a: any, b: any) => b[1] - a[1])
    .slice(0, 2)
    .map((d: any) => d[0]);

  return `
  Approval probability estimated at ${(prob * 100).toFixed(1)}%.
  Primary influencing factors:
  - ${drivers[0]}
  - ${drivers[1]}
  `;
}
