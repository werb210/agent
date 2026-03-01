import { acquireLock, clearLocks, releaseLock } from "../services/lock.service";
import { clearProcessedIds, isDuplicate } from "../services/idempotency.service";
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
    const fetchMock = jest.fn<Promise<Response>, [string, RequestInit?]>()
      .mockResolvedValueOnce({ ok: false, status: 500 } as Response)
      .mockResolvedValueOnce({ ok: true, status: 200 } as Response);

    const originalFetch = global.fetch;
    global.fetch = fetchMock as unknown as typeof fetch;

    try {
      const response = await retryFetch("http://example.com", { method: "GET" }, 3);

      expect(response.ok).toBe(true);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
