const SCRIPT_TAG_REGEX = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
const HTML_TAG_REGEX = /<[^>]+>/g;

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function sanitizeModelInput(value: string): string {
  const noScript = value.replace(SCRIPT_TAG_REGEX, " ");
  const noHtml = noScript.replace(HTML_TAG_REGEX, " ");
  const normalized = normalizeWhitespace(noHtml);
  return normalized.slice(0, 10_000);
}

