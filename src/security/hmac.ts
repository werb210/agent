import crypto from "crypto";

function getSharedSecret(): string {
  const value = process.env.AGENT_SHARED_SECRET;

  if (!value && process.env.NODE_ENV !== "test") {
    throw new Error("Missing required env var: AGENT_SHARED_SECRET");
  }

  return value || "test_secret";
}

export function verifySignature(
  body: string,
  signature: string
): boolean {
  const computed = crypto
    .createHmac("sha256", getSharedSecret())
    .update(body)
    .digest("hex");

  const computedBuf = Buffer.from(computed, "hex");
  const signatureBuf = Buffer.from(signature, "hex");

  if (computedBuf.length !== signatureBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(computedBuf, signatureBuf);
}

export function isFresh(timestamp: number): boolean {
  const now = Date.now();
  return Math.abs(now - timestamp) < 60000;
}
