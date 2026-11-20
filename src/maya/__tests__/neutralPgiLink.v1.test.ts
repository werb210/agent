import { describe, it, expect } from "vitest";
import { neutralPgiLinks } from "../guardrails.js";

describe("neutralPgiLinks", () => {
  it("renames the PGI application link to Apply here", () => {
    const out = neutralPgiLinks("Visit [Boreal Personal Guarantee Insurance Application](https://www.boreal.insure/applications/new).");
    expect(out).toBe("Visit [Apply here](https://www.boreal.insure/applications/new).");
  });
  it("names other boreal.insure links Boreal Risk Management", () => {
    expect(neutralPgiLinks("[Boreal Insurance](https://boreal.insure)")).toBe("[Boreal Risk Management](https://boreal.insure)");
  });
  it("replaces the old brand name in plain text and leaves other links alone", () => {
    expect(neutralPgiLinks("Boreal Insurance can help. [Apply](https://boreal.financial/apply)")).toBe("Boreal Risk Management can help. [Apply](https://boreal.financial/apply)");
  });
});
