jest.mock("../db", () => ({
  pool: {
    query: jest
      .fn()
      .mockResolvedValueOnce({ rows: [{ avg_prob: "0.65" }] })
      .mockResolvedValueOnce({ rows: [{ avg_prob: "0.55" }] })
  }
}));

import { detectMLDrift } from "../core/mlDriftMonitor";

describe("ML Drift Monitor", () => {
  it("drift score should be numeric", async () => {
    const drift = await detectMLDrift();
    expect(typeof drift).toBe("number");
  });
});
