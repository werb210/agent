import { PII_FIELDS } from "./piiMap";

export function detectPII(payload: any) {
  const found = [];
  for (const key of Object.keys(payload ?? {})) {
    if (PII_FIELDS.includes(key)) {
      found.push(key);
    }
  }
  return found;
}
