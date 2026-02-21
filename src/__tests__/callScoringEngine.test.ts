import { scoreCall } from "../engine/callScoringEngine";

describe("scoreCall", () => {
  it("increases score for positive signals", () => {
    const summary = "Revenue stable, over 2 years in business, with strong cash flow.";
    expect(scoreCall(summary)).toBe(60);
  });

  it("decreases score for risk signals", () => {
    const summary = "Declining sales with tax issues despite over 2 years in business.";
    expect(scoreCall(summary)).toBe(0);
  });

  it("clamps score between 0 and 100", () => {
    const summary = [
      "revenue stable",
      "over 2 years in business",
      "strong cash flow",
      "revenue stable",
      "over 2 years in business",
      "strong cash flow"
    ].join(" ");

    expect(scoreCall(summary)).toBeLessThanOrEqual(100);
    expect(scoreCall(summary)).toBeGreaterThanOrEqual(0);
  });
});
