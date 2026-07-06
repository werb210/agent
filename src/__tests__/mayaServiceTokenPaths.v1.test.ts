// MAYA_SERVICE_JWT_ALL_MAYA_v1 - the agent must mint a { kind:"service" } JWT
// for every /api/maya/ BF-Server endpoint (all are verifyMayaService-gated or
// token-agnostic). The original check only matched /api/maya/staff/, so
// catalog-summary and other non-staff Maya endpoints 401'd.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  fileURLToPath(new URL("../integrations/bfServerClient.ts", import.meta.url)),
  "utf-8",
);

describe("Maya service-token path gating", () => {
  it("mints a service token for any /api/maya/ path", () => {
    expect(src).toContain("MAYA_SERVICE_JWT_ALL_MAYA_v1");
    expect(src).toContain('path.includes("/api/maya/")');
    expect(src).toContain('kind: "service", source: "agent"');
  });

  it("no longer restricts the service token to only /api/maya/staff/", () => {
    // The broadened predicate must be the one guarding the service-token mint,
    // not the narrow staff-only one.
    const mintIdx = src.indexOf('path.includes("/api/maya/")');
    const staffOnlyIdx = src.indexOf('path && path.includes("/api/maya/staff/") && secret');
    expect(mintIdx).toBeGreaterThan(-1);
    expect(staffOnlyIdx).toBe(-1);
  });
});
