import { generateSyntheticDeal } from "./syntheticDealGenerator";
import { getMLApprovalProbability } from "../core/mlClient";

describe("ML Regression Stability", () => {
  it("should return probability between 0 and 1", async () => {
    const deal = generateSyntheticDeal();
    const prob = await getMLApprovalProbability(deal);
    expect(prob).toBeGreaterThanOrEqual(0);
    expect(prob).toBeLessThanOrEqual(1);
  });
});
