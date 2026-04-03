import { vi, type MockedFunction, type Mock } from "vitest";
vi.mock("../core/mayaProductIntelligence", () => ({
  getAvailableProductCategories: vi.fn(),
}));

import { handleStartupInquiry } from "../core/mayaStartupHandler";
import * as productModule from "../core/mayaProductIntelligence";

const mockedGetAvailableProductCategories =
  productModule.getAvailableProductCategories as MockedFunction<
    typeof productModule.getAvailableProductCategories
  >;

describe("handleStartupInquiry", () => {
  beforeEach(() => {
    mockedGetAvailableProductCategories.mockClear();
  });

  it("returns available when startup category exists", async () => {
    mockedGetAvailableProductCategories.mockResolvedValue(["Startup Working Capital", "term_loan"]);

    const result = await handleStartupInquiry("do you fund startups?");

    expect(result).toEqual({
      status: "available",
      reply: "Yes — we currently offer startup funding options. I’ll walk you through the details."
    });
  });

  it("returns not_available when startup category does not exist", async () => {
    mockedGetAvailableProductCategories.mockResolvedValue(["term_loan", "line_of_credit"]);

    const result = await handleStartupInquiry("do you fund startups?");

    expect(result).toEqual({
      status: "not_available",
      reply: "At the moment we do not offer startup funding. Would you like to be notified as soon as it becomes available?"
    });
  });
});