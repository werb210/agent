import { validateQualificationInput } from "../core/inputValidator";

describe("validateQualificationInput", () => {
  it("accepts valid qualification input", () => {
    expect(
      validateQualificationInput({
        funding_amount: 100000,
        annual_revenue: 500000,
        time_in_business: 3,
        product_type: "term_loan"
      })
    ).toBe(true);
  });

  it("rejects invalid input", () => {
    expect(() =>
      validateQualificationInput({
        funding_amount: 0,
        annual_revenue: 500000,
        time_in_business: 3,
        product_type: "term_loan"
      })
    ).toThrow("Invalid funding amount");
  });
});
