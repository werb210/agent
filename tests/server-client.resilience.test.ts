import { callWithRetry, normalize, resetCircuitStateForTests, safeCall, serverPost } from "../src/lib/serverClient";

describe("server client resilience", () => {
  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    resetCircuitStateForTests();
  });

  it("retries DB_NOT_READY and eventually succeeds", async () => {
    jest.useFakeTimers();
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error("DB_NOT_READY"))
      .mockRejectedValueOnce(new Error("DB_NOT_READY"))
      .mockResolvedValue("ok");

    const promise = callWithRetry(fn);
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("maps repeated DB_NOT_READY to SERVICE_UNAVAILABLE", async () => {
    jest.useFakeTimers();
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(new Error("DB_NOT_READY"));

    const promise = callWithRetry(fn);
    const expectation = expect(promise).rejects.toThrow("SERVICE_UNAVAILABLE");
    await jest.runAllTimersAsync();
    await expectation;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws INVALID_RESPONSE on malformed payload", () => {
    expect(() => normalize(null)).toThrow("INVALID_RESPONSE");
    expect(() => normalize({ status: "ok" })).toThrow("MISSING_DATA");
  });

  it("normalizes error status payload", () => {
    expect(() => normalize({ status: "error", error: "DB_NOT_READY" })).toThrow("DB_NOT_READY");
  });

  it("serverPost survives temporary DB_NOT_READY responses", async () => {
    jest.useFakeTimers();
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ status: "error", error: "DB_NOT_READY" }) })
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: { ok: true } }) });

    const promise = serverPost<{ ok: boolean }>("/api/test", { ping: true }, "token");
    await jest.runAllTimersAsync();
    await expect(promise).resolves.toEqual({ ok: true });
    expect((globalThis as any).fetch).toHaveBeenCalledTimes(2);
  });

  it("opens circuit after DB_NOT_READY and backs off retries", async () => {
    jest.useFakeTimers();
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(new Error("DB_NOT_READY"));
    const setTimeoutSpy = jest.spyOn(globalThis, "setTimeout");

    const promise = callWithRetry(fn);
    const expectation = expect(promise).rejects.toThrow("SERVICE_UNAVAILABLE");

    await jest.runAllTimersAsync();

    await expectation;
    expect(fn).toHaveBeenCalledTimes(3);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 2500);
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 1000);
  });

  it("recovers after reset timeout when server is ready", async () => {
    jest.useFakeTimers();
    const alwaysDown = jest.fn<Promise<string>, []>().mockRejectedValue(new Error("DB_NOT_READY"));
    const first = callWithRetry(alwaysDown);
    const firstExpectation = expect(first).rejects.toThrow("SERVICE_UNAVAILABLE");
    await jest.runAllTimersAsync();
    await firstExpectation;

    const second = callWithRetry(jest.fn<Promise<string>, []>().mockResolvedValue("ok"));
    await jest.runAllTimersAsync();
    await expect(second).resolves.toBe("ok");
  });

  it("executes fallback path when call fails", async () => {
    await expect(safeCall(async () => Promise.reject(new Error("boom")))).resolves.toEqual({
      fallback: true
    });
  });
});
