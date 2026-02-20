import crypto from "crypto";

const SHARED_SECRET = process.env.AGENT_SHARED_SECRET || "dev_secret";

export function verifySignature(
  body: string,
  signature: string
): boolean {
  const computed = crypto
    .createHmac("sha256", SHARED_SECRET)
    .update(body)
    .digest("hex");

  return computed === signature;
}

export function isFresh(timestamp: number): boolean {
  const now = Date.now();
  return Math.abs(now - timestamp) < 60000;
}
