import { AppError } from "../errors/AppError.js";
export function validateApiKey(key: string) {
  const publicKey = process.env.AGENT_PUBLIC_KEY;
  const internalKey = process.env.AGENT_INTERNAL_KEY;

  if (key === publicKey) return "PUBLIC";
  if (key === internalKey) return "INTERNAL";
  throw new AppError("unauthorized", 401, "Invalid API key");
}
