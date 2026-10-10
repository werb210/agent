import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const reg = readFileSync(fileURLToPath(new URL("../maya/toolRegistry.ts", import.meta.url)), "utf-8");
const aud = readFileSync(fileURLToPath(new URL("../maya/audience.ts", import.meta.url)), "utf-8");

describe("Maya catalog summary tool", () => {
  it("is registered and granted to client and staff (AGENT_MAYA_SITE_FACTS_v371: not visitors - it leaked internal counts)", () => {
    expect(reg).toContain('"catalog.summary"');
    expect((aud.match(/"catalog\.summary"/g) || []).length).toBe(2);
  });
});
