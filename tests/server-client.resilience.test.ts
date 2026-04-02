import { apiFetch } from "../src/utils/apiClient";

describe("server client resilience", () => {
  it("returns json data", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => "",
    });

    await expect(apiFetch("/api/test")).resolves.toEqual({ ok: true });
  });

  it("sends request id and auth headers through api options", async () => {
    delete process.env.AGENT_API_TOKEN;
    process.env.JWT_TOKEN = "runtime-token";

    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => "",
    });

    await apiFetch("/api/test", {
      method: "POST",
      headers: {
        "x-request-id": "rid-123",
      },
      body: JSON.stringify({ ping: true }),
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

  it("throws on non-ok response", async () => {
    (globalThis as any).fetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "service unavailable",
    });

    await expect(apiFetch("/api/test")).rejects.toThrow("API ERROR 503");
  });
});
