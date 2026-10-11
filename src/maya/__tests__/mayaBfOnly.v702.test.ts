// AGENT_MAYA_BF_ONLY_v702
import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../tools/infoCatalog.js";

describe("Maya describes Boreal Financial products only", () => {
  it("has no insurance product in her catalogue", () => {
    expect(PRODUCTS.map((p) => p.key)).not.toContain("pgi");
    expect(JSON.stringify(PRODUCTS)).not.toMatch(/Personal Guarantee Insurance|guaranteed loan amount/);
  });
  // AGENT_v789: the boreal.insure redirect is checked on the live reply in src/api/__tests__/mayaRoute.v789.test.ts.
});
