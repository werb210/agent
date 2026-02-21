import { getDynamicEscalationThreshold } from "../services/adaptiveThreshold";
import { evaluateConfidence } from "../services/confidenceEngine";
import { clusterAdjustedProbability, refineProbability } from "../services/probabilityEngine";
import { getRecommendedAdjustments } from "../services/budgetReallocationEngine";
import { shouldRetryCall } from "../services/outboundIntelligence";
import { classifyDeal } from "../services/dealClusterEngine";
import { evaluateCampaignAdjustment } from "../services/marketingExecutionEngine";
import { buildLenderRecommendationMessage, rankLenders, scoreLenderMatch } from "../services/lenderMatchingEngine";

describe("adaptive threshold", () => {
  it("returns aggressive threshold for high booking conversion", () => {
    expect(getDynamicEscalationThreshold(0.7)).toBe(0.35);
  });

  it("returns cautious threshold for low booking conversion", () => {
    expect(getDynamicEscalationThreshold(0.2)).toBe(0.6);
  });

  it("uses default threshold for mid booking conversion", () => {
    expect(getDynamicEscalationThreshold(0.5)).toBe(0.45);
  });

  it("uses dynamic threshold in confidence escalation", () => {
    const result = evaluateConfidence({
      aiConfidence: 0.4,
      stage: "new",
      message: "hello",
      violationDetected: false,
      bookingConversionRate: 0.7
    });

    expect(result.dynamicThreshold).toBe(0.35);
    expect(result.shouldEscalate).toBe(false);
  });
});

describe("probability refinement", () => {
  it("applies historical factor and caps at 100", () => {
    expect(refineProbability(70, 1.1)).toBe(77);
    expect(refineProbability(80, 1.4)).toBe(100);
  });
});

describe("outbound intelligence", () => {
  it("retries when attempts are under limit and last attempt older than 24 hours", () => {
    const lastAttempt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    expect(shouldRetryCall(2, lastAttempt)).toBe(true);
  });

  it("does not retry after max attempts", () => {
    const lastAttempt = new Date(Date.now() - 48 * 60 * 60 * 1000);
    expect(shouldRetryCall(3, lastAttempt)).toBe(false);
  });
});

describe("budget reallocation", () => {
  it("produces guarded recommendations that require approval", () => {
    const recommendations = getRecommendedAdjustments([
      { channel: "google", roi: 1.7 },
      { channel: "email", roi: 0.7 },
      { channel: "display", roi: 0.3 }
    ]);

    expect(recommendations).toEqual([
      {
        channel: "google",
        recommendation: "Increase budget by 15%",
        requiresApproval: true
      },
      {
        channel: "email",
        recommendation: "Decrease budget by 20%",
        requiresApproval: true
      },
      {
        channel: "display",
        recommendation: "Pause campaign",
        requiresApproval: true
      }
    ]);
  });
});


describe("deal clustering", () => {
  it("classifies deals into expected clusters", () => {
    expect(classifyDeal({ revenue: 150000, yearsInBusiness: 5, requestedAmount: 200000 })).toBe("prime_cluster");
    expect(classifyDeal({ revenue: 60000, yearsInBusiness: 2, requestedAmount: 180000 })).toBe("mid_cluster");
    expect(classifyDeal({ revenue: 25000, yearsInBusiness: 1, requestedAmount: 100000 })).toBe("risk_cluster");
  });

  it("adjusts probability by cluster profile", () => {
    expect(clusterAdjustedProbability(50, "prime_cluster")).toBe(60);
    expect(clusterAdjustedProbability(50, "risk_cluster")).toBe(40);
    expect(clusterAdjustedProbability(50, "mid_cluster")).toBe(50);
  });
});


describe("marketing execution engine", () => {
  it("blocks adjustments when there is not enough data", () => {
    const result = evaluateCampaignAdjustment(
      {
        source: "google",
        leads: 12,
        bookings: 1,
        funded: 0,
        currentBudget: 1000
      },
      {
        autonomy_level: 5,
        allow_full_auto_marketing: true,
        max_daily_budget_shift_percent: 20,
        min_data_points_before_adjustment: 30
      }
    );

    expect(result).toEqual({ adjust: false });
  });

  it("reduces or increases budget based on booking rate", () => {
    const low = evaluateCampaignAdjustment(
      {
        source: "display",
        leads: 40,
        bookings: 2,
        funded: 0,
        currentBudget: 1000
      },
      {
        autonomy_level: 5,
        allow_full_auto_marketing: true,
        max_daily_budget_shift_percent: 20,
        min_data_points_before_adjustment: 30
      }
    );

    const high = evaluateCampaignAdjustment(
      {
        source: "search",
        leads: 40,
        bookings: 16,
        funded: 6,
        currentBudget: 1000
      },
      {
        autonomy_level: 5,
        allow_full_auto_marketing: true,
        max_daily_budget_shift_percent: 20,
        min_data_points_before_adjustment: 30
      }
    );

    expect(low.adjust).toBe(true);
    expect(low.newBudget).toBe(800);
    expect(high.adjust).toBe(true);
    expect(high.newBudget).toBe(1200);
  });
});

describe("lender matching engine", () => {
  const deal = {
    revenue: 250000,
    yearsInBusiness: 5,
    requestedAmount: 125000,
    industry: "construction"
  };

  const lenders = [
    {
      lenderName: "Lender A",
      minRevenue: 150000,
      minYears: 2,
      maxExposure: 250000,
      industriesAllowed: ["construction", "retail"]
    },
    {
      lenderName: "Lender B",
      minRevenue: 300000,
      minYears: 4,
      maxExposure: 100000,
      industriesAllowed: ["retail"]
    }
  ];

  it("scores and ranks lenders", () => {
    expect(scoreLenderMatch(deal, lenders[0])).toBe(100);
    expect(scoreLenderMatch(deal, lenders[1])).toBe(25);

    expect(rankLenders(deal, lenders)).toEqual([
      { lender: "Lender A", score: 100 },
      { lender: "Lender B", score: 25 }
    ]);
  });

  it("returns internal ranking for staff and generic copy for client", () => {
    const ranked = rankLenders(deal, lenders);

    expect(buildLenderRecommendationMessage(ranked, "staff")).toContain("Top 3 Recommended Lenders");
    expect(buildLenderRecommendationMessage(ranked, "staff")).toContain("Lender A — 100%");
    expect(buildLenderRecommendationMessage(ranked, "client")).toBe(
      "Based on your profile, several lenders may be suitable."
    );
  });
});
