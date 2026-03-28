export function validateInput<T extends object>(input: T | unknown): T {
  if (!input || typeof input !== "object") {
    throw new Error("INVALID_AGENT_INPUT");
  }

  if (!("intent" in input) || !((input as Record<string, unknown>).intent)) {
    throw new Error("MISSING_INTENT");
  }

  return input as T;
}
