import { callServer, normalize, resetCircuitStateForTests, safeCall, serverPost } from "../src/lib/serverClient";

describe("server client resilience", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    resetCircuitStateForTests();
  });

  it("throws INVALID_RESPONSE_FORMAT on malformed payload", () => {
    expect(() => normalize(null)).toThrow("INVALID_RESPONSE_FORMAT");
    expect(() => normalize({ status: "ok" })).toThrow("INVALID_RESPONSE_FORMAT");
  });

  it("normalizes error status payload", () => {
    expect(() => normalize({ status: "error", error: "DB_NOT_READY" })).toThrow("DB_NOT_READY");
  });

  it("serverPost unwraps envelope and returns data", async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        status: 200,
        json: async () => ({ status: "ok", data: { ok: true } })
      });

    await expect(serverPost<{ ok: boolean }>("/api/test", { ping: true }, "token", "rid-123")).resolves.toEqual({
      ok: true
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-request-id": "rid-123"
        })
      })
    );
  });

  it("fails if endpoint missing", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValue({
      status: 404,
      json: async () => ({ status: "error", error: "Not found" })
    });

    await expect(callServer("/bad/route", {}, "token", "rid")).rejects.toThrow("ENDPOINT_NOT_FOUND");
  });

  it("returns structured error when call fails", async () => {
    await expect(safeCall(async () => Promise.reject(new Error("boom")))).resolves.toEqual({
      status: "error",
      error: "boom"
    });
  });
});
