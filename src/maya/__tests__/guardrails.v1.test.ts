// AGENT_GUARDRAILS_v1
import { describe, it, expect } from "vitest";
import { applyGuardrails, assertsFundingOutcome, GUARDRAIL_SAFE_REPLY } from "../guardrails.js";
import { MAYA_SYSTEM_PROMPT } from "../../prompts/system.js";

describe("funding outcome guardrail", () => {
  const blocked = [
    "Good news - you are approved for a term loan.",
    "You're pre-approved based on what you have told me.",
    "You will be funded within three days.",
    "You'll qualify for a line of credit with those numbers.",
    "That is guaranteed approval with your revenue.",
    "We guarantee funding for businesses like yours.",
    "You definitely qualify for factoring.",
    "Unfortunately you will be declined.",
    "You do not qualify for this product.",
  ];

  for (const reply of blocked) {
    it(`blocks: ${reply.slice(0, 40)}`, () => {
      expect(assertsFundingOutcome(reply)).toBe(true);
      expect(applyGuardrails(reply)).toBe(GUARDRAIL_SAFE_REPLY);
    });
  }

  const allowed = [
    "A lender decides approval after reviewing your file.",
    "Applying costs nothing and does not affect your credit.",
    "Most complete applications reach funding in three to four days.",
    "Term loans are a lump sum repaid on a fixed schedule.",
    "I cannot say whether you would be approved - that is the lender's call.",
    "We work with lenders across Canada and the United States.",
  ];

  for (const reply of allowed) {
    it(`allows: ${reply.slice(0, 40)}`, () => {
      expect(assertsFundingOutcome(reply)).toBe(false);
      expect(applyGuardrails(reply)).toBe(reply);
    });
  }
});

describe("system prompt disclosure rules", () => {
  it("forbids naming individual lenders", () => {
    expect(MAYA_SYSTEM_PROMPT).toMatch(/NEVER name, identify, hint at, or describe any individual lender/);
  });

  it("forbids asserting a funding outcome", () => {
    expect(MAYA_SYSTEM_PROMPT).toMatch(/NEVER state, suggest, imply, predict, or hint/);
  });
});
