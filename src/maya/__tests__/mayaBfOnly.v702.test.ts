// AGENT_MAYA_BF_ONLY_v702
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { PRODUCTS } from "../tools/infoCatalog.js";

describe("Maya describes Boreal Financial products only", () => {
  it("has no insurance product in her catalogue", () => {
    expect(PRODUCTS.map((p) => p.key)).not.toContain("pgi");
    expect(JSON.stringify(PRODUCTS)).not.toMatch(/Personal Guarantee Insurance|guaranteed loan amount/);
  });
  it("points insurance questions to boreal.insure without describing coverage", () => {
    const src = readFileSync("src/api/maya.ts", "utf8");
    expect(src).toContain("Boreal Risk Management, at boreal.insure");
    expect(src).not.toContain("coverage that protects business owners");
  });
});
