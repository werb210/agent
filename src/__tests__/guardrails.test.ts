import { complianceFilter } from "../guardrails/complianceFilter";
import { sanitizeRateLanguage } from "../guardrails/rateRangeGuard";

describe("guardrails", () => {
  it("replaces specific rates with safe language", () => {
    const reply = "You may receive 9.25% if eligible.";

    expect(sanitizeRateLanguage(reply)).toBe(
      "You may receive rates vary depending on lender and profile if eligible."
    );
  });

  it("flags and replaces forbidden approval predictions", () => {
    const filtered = complianceFilter("You will be approved at 9.25%.");

    expect(filtered.violationDetected).toBe(true);
    expect(filtered.escalated).toBe(true);
    expect(filtered.safeReply).toContain(
      "I can’t provide approval predictions or financial advice"
    );
  });

  it("passes safe replies through unchanged", () => {
    const reply = "Thanks for your message. A specialist can help review your options.";

    expect(complianceFilter(reply)).toEqual({
      safeReply: reply,
      escalated: false,
      violationDetected: false
    });
  });
});
