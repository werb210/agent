export function sanitizeRateLanguage(reply: string): string {
  // Replace hard numbers that imply specific quotes
  const specificRatePattern = /\b\d{1,2}\.\d{1,2}%/g;

  return reply.replace(
    specificRatePattern,
    "rates vary depending on lender and profile"
  );
}
