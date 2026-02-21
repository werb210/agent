import { getDynamicEscalationThreshold } from "../services/adaptiveThreshold";
import { evaluateConfidence } from "../services/confidenceEngine";
import { clusterAdjustedProbability, refineProbability } from "../services/probabilityEngine";
import { getRecommendedAdjustments } from "../services/budgetReallocationEngine";
import { shouldRetryCall } from "../services/outboundIntelligence";
import { classifyDeal } from "../services/dealClusterEngine";

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
