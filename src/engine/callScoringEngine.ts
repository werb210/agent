export function scoreCall(summary: string) {
  const normalizedSummary = summary.toLowerCase();
  let score = 0;

  if (normalizedSummary.includes("revenue stable")) score += 20;
  if (normalizedSummary.includes("over 2 years in business")) score += 20;
  if (normalizedSummary.includes("strong cash flow")) score += 20;
  if (normalizedSummary.includes("tax issues")) score -= 20;
  if (normalizedSummary.includes("declining sales")) score -= 20;

  return Math.max(0, Math.min(100, score));
}
