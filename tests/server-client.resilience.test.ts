import { api } from "../src/lib/api";

describe("server client resilience", () => {
  it("returns envelope data", async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ status: "ok", data: { ok: true } })
      });

    await expect(api<{ ok: boolean }>("/api/test")).resolves.toEqual({ ok: true });
  });

  it("throws on non-ok envelope", async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ status: "error", error: "DB_NOT_READY" })
      });

    await expect(api("/api/test")).rejects.toThrow("DB_NOT_READY");
  });

  it("sends request id and auth headers through api options", async () => {
    (globalThis as any).fetch = jest
      .fn()
      .mockResolvedValueOnce({
        json: async () => ({ status: "ok", data: { ok: true } })
      });

    await api("/api/test", {
      method: "POST",
      headers: {
        Authorization: "Bearer token",
        "x-request-id": "rid-123",
      },
      body: { ping: true },
    });

    expect((globalThis as any).fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer token",
          "x-request-id": "rid-123"
        })
      })
    );
  });
});
