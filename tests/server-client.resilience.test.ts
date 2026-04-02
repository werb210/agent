import { api, apiFetch } from "../src/lib/api";

describe("server client resilience", () => {
  it("returns envelope data", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ status: "ok", data: { ok: true } }),
      status: 200,
    });

    await expect(api<{ ok: boolean }>("/api/test")).resolves.toEqual({ ok: true });
  });

  it("throws on non-ok envelope", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ status: "error", error: "DB_NOT_READY" }),
      status: 200,
    });

    await expect(api("/api/test")).rejects.toThrow("DB_NOT_READY");
  });

  it("sends request id and auth headers through api options", async () => {
    process.env.JWT_TOKEN = "runtime-token";

    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
      json: async () => ({ status: "ok", data: { ok: true } }),
      status: 200,
    });

    await api("/api/test", {
      method: "POST",
      headers: {
        "x-request-id": "rid-123",
      },
      body: { ping: true },
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer runtime-token",
          "x-request-id": "rid-123",
        }),
      })
    );
  });

  it("throws SERVICE_NOT_READY on 503", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({ status: 503 });

    await expect(apiFetch("/api/test")).rejects.toThrow("SERVICE_NOT_READY");
  });

  it("throws UNAUTHORIZED on 401", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({ status: 401 });

    await expect(apiFetch("/api/test")).rejects.toThrow("UNAUTHORIZED");
  });

  it("throws ENDPOINT_DEPRECATED on 410", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({ status: 410 });

    await expect(apiFetch("/api/test")).rejects.toThrow("ENDPOINT_DEPRECATED");
  });
});
