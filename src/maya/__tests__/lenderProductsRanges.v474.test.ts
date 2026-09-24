// AGENT_BLOCK_v474_MAYA_QUOTE_FROM_RANGES
import { describe, it, expect } from "vitest";
import { LENDER_PRODUCTS_TOOL_DESCRIPTOR } from "../tools/staffReadTools";

describe("v474 lender.products descriptor", () => {
  const d = LENDER_PRODUCTS_TOOL_DESCRIPTOR.function.description;
  it("tells Maya to quote limits from ranges, not the 50-row sample", () => {
    expect(d).toContain("ALWAYS quote funding limits, amounts and rates from `ranges`, never from `products`");
  });
  it("keeps rate kinds apart", () => {
    expect(d).toContain("never mix APR, monthly and factor rates");
  });
});
