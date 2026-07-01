import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const reg = readFileSync(fileURLToPath(new URL("../maya/toolRegistry.ts", import.meta.url)), "utf-8");
const aud = readFileSync(fileURLToPath(new URL("../maya/audience.ts", import.meta.url)), "utf-8");

describe("Maya marketing tools", () => {
  it("registers marketing tools and grants them to staff", () => {
    for (const t of ["marketing.overview", "marketing.send_campaign"]) {
      expect(reg).toContain(`"${t}"`);
      expect(aud).toContain(`"${t}"`);
    }
  });
});
