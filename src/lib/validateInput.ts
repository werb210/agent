export function validateInput(input: unknown): void {
  if (!input) {
    throw new Error("Missing input");
  }

  if (typeof input !== "object") {
    throw new Error("Invalid input type");
  }
}
