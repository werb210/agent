const queryMock = jest.fn();

jest.mock("pg", () => ({
  Pool: jest.fn().mockImplementation(() => ({
    query: queryMock
  }))
}));

import { calculateFundingProbability } from "../core/probabilityEngine";
import { calculateDealLTV } from "../core/ltvEngine";
import { generateRiskHeatmap } from "../core/portfolioRisk";
import { routeDeal } from "../core/autoRouting";
import { detectStalledDeals } from "../core/churnDetection";
import { optimalFollowupTime } from "../core/followupTiming";
import { forecast90Days } from "../core/capitalForecast";

describe("capital intelligence layer", () => {
  beforeEach(() => {
    queryMock.mockReset();
  });

  it("calculates weighted funding probability", async () => {
    queryMock.mockResolvedValue({
      rows: [
        { feature: "funding_amount", weight: "100000" },
        { feature: "annual_revenue", weight: "500000" },
        { feature: "time_in_business", weight: "24" }
      ]
    });

    const probability = await calculateFundingProbability({
      funding_amount: 100000,
      annual_revenue: 500000,
      time_in_business: 24
    });

    expect(probability).toBe(0.95);
  });

  it("computes deal LTV", () => {
    expect(calculateDealLTV({ funding_amount: 100000, product_type: "LOC" })).toBeCloseTo(5520, 6);
    expect(calculateDealLTV({ funding_amount: 100000, product_type: "MCA" })).toBeCloseTo(4050, 6);
  });

  it("generates portfolio risk heatmap", async () => {
    queryMock.mockResolvedValue({
      rows: [
        { industry: "construction", avg_risk: "0.8" },
        { industry: "retail", avg_risk: "0.5" },
        { industry: "services", avg_risk: "0.2" }
      ]
    });

    const heatmap = await generateRiskHeatmap();

    expect(heatmap).toEqual([
      { industry: "construction", risk_level: "high" },
      { industry: "retail", risk_level: "moderate" },
      { industry: "services", risk_level: "low" }
    ]);
  });

  it("routes deal to top broker", async () => {
    queryMock
      .mockResolvedValueOnce({ rows: [{ broker_id: "broker-1" }] })
      .mockResolvedValueOnce({ rows: [] });

    const brokerId = await routeDeal("session-1");

    expect(brokerId).toBe("broker-1");
    expect(queryMock).toHaveBeenLastCalledWith(expect.stringContaining("UPDATE sessions"), ["broker-1", "session-1"]);
  });

  it("returns null when no brokers are available", async () => {
    queryMock.mockResolvedValue({ rows: [] });

    const brokerId = await routeDeal("session-2");

    expect(brokerId).toBeNull();
  });

  it("detects stalled deals", async () => {
    queryMock.mockResolvedValue({ rows: [{ id: "s1" }, { id: "s2" }] });

    const stalled = await detectStalledDeals();

    expect(stalled).toEqual([{ id: "s1" }, { id: "s2" }]);
  });

  it("recommends follow-up timing", () => {
    expect(optimalFollowupTime(0.85)).toBe("within_1_hour");
    expect(optimalFollowupTime(0.7)).toBe("within_24_hours");
    expect(optimalFollowupTime(0.4)).toBe("3_days");
  });

  it("forecasts funded capital for 30/60/90 days", async () => {
    queryMock.mockResolvedValue({ rows: [{ avg: "250000" }] });

    const forecast = await forecast90Days();

    expect(forecast).toEqual({
      projected_30_day: 250000,
      projected_60_day: 500000,
      projected_90_day: 750000
    });
  });
});
