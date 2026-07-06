// MAYA_SERVICE_JWT_CATALOG_FIX_v1 - the catalog-summary endpoint is
// verifyMayaService-gated on BF-Server but sits outside /api/maya/staff/, so
// the client must mint a { kind:"service" } token for it too, or Maya's
// "how many lenders / products" answers 401 and fails.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const src = readFileSync(
  fileURLToPath(new URL("../integrations/bfServerClient.ts", import.meta.url)),
  "utf-8",
);

describe("Maya service-token path gating", () => {
  it("mints a service token for the catalog-summary endpoint", () => {
    expect(src).toContain("MAYA_SERVICE_JWT_CATALOG_FIX_v1");
    expect(src).toContain('/api/maya/catalog-summary');
    expect(src).toContain("needsServiceToken");
  });

  it("still mints a service token for staff endpoints", () => {
    expect(src).toContain('/api/maya/staff/');
    expect(src).toContain('kind: "service", source: "agent"');
  });
});
