import { allocateMarketingBudget } from "../core/capitalAllocator";
import { optimizeCommission } from "../core/commissionOptimizer";
import { calculateDealPriority } from "../core/dealPriorityEngine";
import { predictiveLenderScore } from "../core/lenderMatchEngine";
import { identifyExpansionMarkets } from "../core/marketExpansionEngine";
import { advancedStrategicDecision } from "../core/strategicEngine";
import { retrainModel } from "../core/selfLearningEngine";
import { pool } from "../db";

jest.mock("../db", () => ({
  pool: {
    query: jest.fn()
  }
}));

describe("self-optimizing intelligence core", () => {
  beforeEach(() => {
    (pool.query as jest.Mock).mockReset();
  });

  it("trains and upserts feature weights from funded records", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({
        rows: [
          { funded: true, funding_amount: 100000, annual_revenue: 500000, time_in_business: 5 },
          { funded: false, funding_amount: 200000, annual_revenue: 800000, time_in_business: 7 },
          { funded: true, funding_amount: 50000, annual_revenue: 200000, time_in_business: 2 }
        ],
        rowCount: 3
      })
      .mockResolvedValueOnce({ rows: [] });

    await retrainModel();

    expect(pool.query).toHaveBeenCalledTimes(2);
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO maya_feature_weights"),
      [50000, 233333.33333333334, 2.3333333333333335]
    );
  });

  it("scores lender fit using learned feature weights", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { feature: "funding_amount", weight: 100000 },
        { feature: "annual_revenue", weight: 250000 },
        { feature: "time_in_business", weight: 5 }
      ]
    });

    const score = await predictiveLenderScore({
      funding_amount: 100000,
      annual_revenue: 500000,
      time_in_business: 10
    });

    expect(score).toBe(5);
  });

  it("classifies deal priority and strategic action", async () => {
    (pool.query as jest.Mock).mockResolvedValue({
      rows: [
        { feature: "funding_amount", weight: 100000 },
        { feature: "annual_revenue", weight: 250000 },
        { feature: "time_in_business", weight: 5 }
      ]
    });

    const priority = await calculateDealPriority({
      funding_amount: 100000,
      annual_revenue: 500000,
      time_in_business: 10
    });

    expect(priority).toEqual({ lenderScore: 5, priority: "medium" });

    const strategy = await advancedStrategicDecision({
      funding_amount: 100000,
      annual_revenue: 500000,
      time_in_business: 10
    });

    expect(strategy).toEqual({
      lenderScore: 5,
      priority: "medium",
      recommended_action: "automated_nurture_sequence"
    });
  });

  it("optimizes commission based on funded ticket averages", async () => {
    (pool.query as jest.Mock)
      .mockResolvedValueOnce({ rows: [{ avg_ticket: 600000 }] })
      .mockResolvedValueOnce({ rows: [] });

    const rate = await optimizeCommission("term_loan");

    expect(rate).toBe(0.025);
    expect(pool.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("INSERT INTO maya_commission_models"),
      ["term_loan", 0.025]
    );
  });

  it("allocates marketing budget by weighted industry performance", () => {
    const allocation = allocateMarketingBudget(10000, [
      { name: "retail", conversion_rate: 0.1, avg_ticket: 200000 },
      { name: "construction", conversion_rate: 0.2, avg_ticket: 300000 }
    ]);

    expect(allocation).toEqual([
      { industry: "retail", allocated_budget: 2500 },
      { industry: "construction", allocated_budget: 7500 }
    ]);
  });

  it("ranks expansion markets by funded success rate", async () => {
    (pool.query as jest.Mock).mockResolvedValueOnce({
      rows: [
        { industry: "retail", wins: "10", total: "20" },
        { industry: "healthcare", wins: "8", total: "10" }
      ]
    });

    const markets = await identifyExpansionMarkets();

    expect(markets).toEqual([
      { industry: "healthcare", success_rate: 0.8 },
      { industry: "retail", success_rate: 0.5 }
    ]);
  });
});
