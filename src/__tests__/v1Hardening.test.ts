import { acquireLock, clearLocks, releaseLock } from "../services/lock.service";
import { clearProcessedIds, isDuplicate } from "../services/idempotency.service";
import { withRetry } from "../lib/retry";

describe("v1 hardening primitives", () => {
  beforeEach(() => {
    clearLocks();
    clearProcessedIds();
    jest.restoreAllMocks();
  });

  it("deduplicates webhook event ids", () => {
    expect(isDuplicate("call-1")).toBe(false);
    expect(isDuplicate("call-1")).toBe(true);
  });

  it("allows only one concurrent lock holder", async () => {
    const attempts = await Promise.all(
      Array.from({ length: 100 }, () => Promise.resolve(acquireLock("call-2")))
    );

    expect(attempts.filter(Boolean)).toHaveLength(1);
    expect(attempts.filter((value) => !value)).toHaveLength(99);

    releaseLock("call-2");
    expect(acquireLock("call-2")).toBe(true);
  });

  it("retries transient failures", async () => {
    let attempts = 0;

    const result = await withRetry(async () => {
      attempts += 1;

      if (attempts === 1) {
        throw new Error("transient");
      }

      return "ok";
    });

    expect(result).toBe("ok");
    expect(attempts).toBe(2);
  });
});
