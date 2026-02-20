export function validateApiKey(key: string) {
  const publicKey = process.env.AGENT_PUBLIC_KEY;
  const internalKey = process.env.AGENT_INTERNAL_KEY;

  if (key === publicKey) return "PUBLIC";
  if (key === internalKey) return "INTERNAL";
  throw new Error("Invalid API key");
}
