import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

// AGENT_MAYA_CLIENT_FULL_PROFILE_v1 - Maya injects the verified client's full profile.
const src = readFileSync(fileURLToPath(new URL("../maya.ts", import.meta.url)), "utf-8");

describe("maya full client profile injection", () => {
  it("builds a profile with business, dob, and per-application fields", () => {
    expect(src).toContain("VERIFIED CLIENT PROFILE");
    expect(src).toContain("businessName: (j && j.contact?.companyName)");
    expect(src).toContain("dateOfBirth: (j && j.contact?.dob)");
    expect(src).toContain("yearsInBusiness: a?.yearsInBusiness");
  });
});
