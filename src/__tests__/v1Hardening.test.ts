import { acquireLock, clearLocks, releaseLock } from "../services/lock.service";
import { clearProcessedIds, isDuplicate } from "../services/idempotency.service";
import axios from "axios";
import { retryFetch } from "../services/retryFetch";

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

  it("retries transient upstream failures", async () => {
    const requestSpy = jest.spyOn(axios, "request")
      .mockResolvedValueOnce({ status: 500 } as any)
      .mockResolvedValueOnce({ status: 200 } as any);

    const response = await retryFetch("http://example.com", { method: "GET" }, 3);

    expect(response.status).toBe(200);
    expect(requestSpy).toHaveBeenCalledTimes(2);
  });
});
