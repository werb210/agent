import { callWithRetry, normalize, serverPost } from "../src/lib/serverClient";

describe("server client resilience", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("retries DB_NOT_READY and eventually succeeds", async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error("DB_NOT_READY"))
      .mockRejectedValueOnce(new Error("DB_NOT_READY"))
      .mockResolvedValue("ok");

    const promise = callWithRetry(fn);
    await expect(promise).resolves.toBe("ok");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("maps repeated DB_NOT_READY to SERVICE_UNAVAILABLE", async () => {
    const fn = jest.fn<Promise<string>, []>().mockRejectedValue(new Error("DB_NOT_READY"));

    await expect(callWithRetry(fn)).rejects.toThrow("SERVICE_UNAVAILABLE");
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("throws INVALID_RESPONSE on malformed payload", () => {
    expect(() => normalize(null)).toThrow("INVALID_RESPONSE");
    expect(() => normalize({ status: "ok" })).toThrow("INVALID_RESPONSE");
  });

  it("normalizes error status payload", () => {
    expect(() => normalize({ status: "error", error: "DB_NOT_READY" })).toThrow("DB_NOT_READY");
  });

  it("serverPost survives temporary DB_NOT_READY responses", async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({ json: async () => ({ status: "error", error: "DB_NOT_READY" }) })
      .mockResolvedValueOnce({ json: async () => ({ success: true, data: { ok: true } }) });

    await expect(serverPost<{ ok: boolean }>("/api/test", { ping: true }, "token")).resolves.toEqual({ ok: true });
    expect((globalThis as any).fetch).toHaveBeenCalledTimes(2);
  });
});
