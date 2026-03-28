export function validateInput<T extends object>(input: T | unknown): T {
  if (!input) {
    throw new Error("Missing input");
  }

  if (typeof input !== "object") {
    throw new Error("Invalid input type");
  }

  return input as T;
}
