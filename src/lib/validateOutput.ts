export function validateOutput<T extends Record<string, unknown>>(output: T | unknown): T {
  if (!output) {
    throw new Error("Empty output");
  }

  if (typeof output !== "object") {
    throw new Error("Invalid output");
  }

  return output as T;
}
