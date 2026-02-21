export function evaluateDealRisk(message: string) {
  const lower = message.toLowerCase();

  // Detect high-value deal amounts
  const match = lower.match(/\$?(\d{1,3}(,\d{3})*(\.\d+)?)/);

  if (!match) return { highValue: false };

  const numeric = Number(match[1].replace(/,/g, ""));

  if (numeric >= 500000) {
    return { highValue: true };
  }

  return { highValue: false };
}
