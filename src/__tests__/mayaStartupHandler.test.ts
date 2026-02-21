import { handleStartupInquiry } from "../core/mayaStartupHandler";
import { getAvailableProductCategories } from "../core/mayaProductIntelligence";

jest.mock("../core/mayaProductIntelligence", () => ({
  getAvailableProductCategories: jest.fn()
}));

describe("handleStartupInquiry", () => {
  it("returns available when startup category exists", async () => {
    (getAvailableProductCategories as jest.Mock).mockResolvedValue(["Startup Working Capital", "term_loan"]);

    const result = await handleStartupInquiry("do you fund startups?");

    expect(result).toEqual({
      status: "available",
      reply: "Yes — we currently offer startup funding options. I’ll walk you through the details."
    });
  });

  it("returns not_available when startup category does not exist", async () => {
    (getAvailableProductCategories as jest.Mock).mockResolvedValue(["term_loan", "line_of_credit"]);

    const result = await handleStartupInquiry("do you fund startups?");

    expect(result).toEqual({
      status: "not_available",
      reply: "At the moment we do not offer startup funding. Would you like to be notified as soon as it becomes available?"
    });
  });
});
