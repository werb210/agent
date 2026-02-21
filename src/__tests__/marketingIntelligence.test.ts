import { extractApplicationFields, hasRequiredApplicationFields } from "../services/applicationIntake";
import { getCappedBudgetAdjustment, suggestAdjustments } from "../services/marketingAdvisor";
import { calculateFundingProbability } from "../services/probabilityEngine";
import { calculateROI } from "../services/roiEngine";

describe("marketing intelligence services", () => {
  it("groups ROI data by source", () => {
    const result = calculateROI([
      { utm_source: "google", booked: true, funded: false },
      { utm_source: "google", booked: false, funded: false },
      { utm_source: "facebook", booked: true, funded: true }
    ]);

    expect(result.google).toEqual({ leads: 2, bookings: 1, funded: 0 });
    expect(result.facebook).toEqual({ leads: 1, bookings: 1, funded: 1 });
  });

  it("builds advisory suggestions", () => {
    const suggestions = suggestAdjustments({
      tiktok: { leads: 30, bookings: 4, funded: 1 },
      google: { leads: 10, bookings: 6, funded: 7 }
    });

    expect(suggestions).toContain("Consider refining targeting for tiktok.");
    expect(suggestions).toContain("Increase budget allocation to google.");
  });

  it("calculates funding probability", () => {
    const probability = calculateFundingProbability({
      revenue: 100000,
      yearsInBusiness: 4,
      requestedAmount: 120000,
      creditScore: 720
    });

    expect(probability).toBe(80);
  });

  it("extracts application fields from conversation", () => {
    const context = extractApplicationFields({}, "Our revenue is 90000 and we have 3 years in business.");
    const withAmount = extractApplicationFields(context, "We need $50000 for inventory.");
    const withContact = extractApplicationFields(
      withAmount,
      "Purpose: seasonal inventory. Email owner@example.com phone +1 (555) 444-1212"
    );

    expect(withContact.revenue).toBe(90000);
    expect(withContact.yearsInBusiness).toBe(3);
    expect(withContact.requestedAmount).toBe(50000);
    expect(withContact.purpose).toContain("seasonal inventory");
    expect(withContact.email).toBe("owner@example.com");
    expect(hasRequiredApplicationFields(withContact)).toBe(true);
  });

  it("caps automatic budget adjustments at configured settings", () => {
    const capped = getCappedBudgetAdjustment(18, {
      autonomy_level: 4,
      allow_ad_adjustment: true,
      max_auto_budget_adjust_percent: 10
    });

    const blocked = getCappedBudgetAdjustment(8, {
      autonomy_level: 3,
      allow_ad_adjustment: true,
      max_auto_budget_adjust_percent: 10
    });

    expect(capped).toBe(10);
    expect(blocked).toBeNull();
  });
});
