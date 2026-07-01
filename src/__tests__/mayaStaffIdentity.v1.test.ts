import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const src = readFileSync(fileURLToPath(new URL("../api/maya.ts", import.meta.url)), "utf-8");

describe("Maya staff identity injection", () => {
  it("injects a staff identity line for the staff audience", () => {
    expect(src).toContain("AGENT_MAYA_STAFF_IDENTITY_v1");
    expect(src).toContain('audience === "staff" && req.body?.staff');
    expect(src).toContain("SIGNED-IN STAFF MEMBER");
  });
});
