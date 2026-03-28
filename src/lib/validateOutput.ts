export function validateOutput<T extends object>(output: T | unknown): T {
  if (!output || typeof output !== "object") {
    throw new Error("Invalid output");
  }

  if (!("result" in output)) {
    throw new Error("Missing result");
  }

  if ((output as { result: unknown }).result === undefined || (output as { result: unknown }).result === null) {
    throw new Error("Empty result");
  }

  return output as T;
}
