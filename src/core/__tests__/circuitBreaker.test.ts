import { CircuitBreaker } from "../circuitBreaker";

describe("CircuitBreaker overload protection", () => {
  it("times out a slow operation", async () => {
    const breaker = new CircuitBreaker({
      timeout: 10,
      failureThreshold: 5,
      resetTimeout: 100
    });

    await expect(
      breaker.execute(async () => new Promise<string>(() => undefined))
    ).rejects.toThrow("Timeout");
  });

  it("trips after repeated failures", async () => {
    const breaker = new CircuitBreaker({
      timeout: 50,
      failureThreshold: 5,
      resetTimeout: 10_000
    });

    for (let i = 0; i < 5; i += 1) {
      await expect(
        breaker.execute(async () => {
          throw new Error("upstream_failed");
        })
      ).rejects.toThrow("upstream_failed");
    }

    await expect(
      breaker.execute(async () => {
        throw new Error("upstream_failed");
      })
    ).rejects.toThrow("SERVICE_UNAVAILABLE");
    expect(breaker.getState()).toBe("OPEN");
  });
});
