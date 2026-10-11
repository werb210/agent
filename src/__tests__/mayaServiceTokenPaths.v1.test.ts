// MAYA_SERVICE_JWT_ALL_MAYA_v1 - the agent must present a { kind:"service" } JWT
// to every BF-Server endpoint. v784: one signer (src/lib/serviceToken.ts) for every path.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  fileURLToPath(new URL("../integrations/bfServerClient.ts", import.meta.url)),
  "utf-8",
);

describe("Maya service-token path gating", () => {
  it("mints the shared service token for every path", () => {
    expect(src).toContain("MAYA_SERVICE_JWT_ALL_MAYA_v1");
    expect(src).toContain("signServiceToken(secret)");
    expect(src).not.toContain("jwt.sign(");
  });

  it("no longer restricts the service token to only /api/maya/staff/", () => {
    expect(src).not.toContain('path && path.includes("/api/maya/staff/") && secret');
  });
});
