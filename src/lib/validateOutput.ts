export function validateOutput<T extends object>(output: T | unknown): T {
  if (!output || typeof output !== "object") {
    throw new Error("Invalid output structure");
  }

  if (!(output as { result?: unknown }).result) {
    throw new Error("Missing result field");
  }

  return output as T;
}
