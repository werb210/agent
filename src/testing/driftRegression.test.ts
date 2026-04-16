import { vi } from "vitest";

vi.mock("../db", () => ({
  pool: {
    request: vi.fn().mockResolvedValue({ rows: [{ avg_prob: "0.65" }] }),
    query: vi.fn()
  }
}));

import { detectMLDrift } from "../core/mlDriftMonitor";
import { pool } from "../integrations/bfServerClient";

describe("ML Drift Monitor", () => {
  beforeEach(() => {
    (pool.request as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ rows: [{ avg_prob: "0.65" }] });
  });

  it("drift score should be numeric", async () => {
    const drift = await detectMLDrift();
    expect(typeof drift).toBe("number");
  });
});
