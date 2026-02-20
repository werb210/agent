import crypto from "crypto";

import { validatePermissions } from "../security/permissions";
import { verifySignature } from "../security/hmac";
import { validateApiKey } from "../security/apiKeys";

test("Website cannot forecast", () => {
  expect(() =>
    validatePermissions("WEBSITE_VISITOR", "forecast")
  ).toThrow();
});

test("verifySignature accepts correct signature", () => {
  const body = JSON.stringify({ hello: "world" });
  const signature = crypto
    .createHmac("sha256", process.env.AGENT_SHARED_SECRET || "dev_secret")
    .update(body)
    .digest("hex");

  expect(verifySignature(body, signature)).toBe(true);
});

test("validateApiKey resolves tiers and rejects unknown", () => {
  process.env.AGENT_PUBLIC_KEY = "public_key_here";
  process.env.AGENT_INTERNAL_KEY = "internal_key_here";

  expect(validateApiKey("public_key_here")).toBe("PUBLIC");
  expect(validateApiKey("internal_key_here")).toBe("INTERNAL");
  expect(() => validateApiKey("bad_key")).toThrow("Invalid API key");
});
