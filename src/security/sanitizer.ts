import validator from "validator";

export function sanitizeString(input: string) {
  return validator.escape(input.trim());
}
