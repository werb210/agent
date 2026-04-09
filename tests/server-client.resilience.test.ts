import { apiFetch } from "../src/utils/apiClient";

describe("server client resilience", () => {
  it("returns json data", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => "",
    });

    await expect(apiFetch("/api/test")).resolves.toEqual({ ok: true });
  });

  it("sends request id and auth headers through api options", async () => {
    delete process.env.AGENT_API_TOKEN;
    process.env.JWT_SECRET = "test-secret";

    (globalThis as any).fetch = vi.fn().mockResolvedValueOnce({
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

    const [url, options] = (globalThis as any).fetch.mock.calls[0];
    expect(url).toEqual(expect.any(String));
    expect(options).toEqual(
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-request-id": "rid-123",
        }),
      })
    );
    expect((options as { headers: Record<string, string> }).headers.Authorization).toMatch(/^Bearer\s.+/);
  });

  it("throws on non-ok response", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 503,
      text: async () => "service unavailable",
    });

    await expect(apiFetch("/api/test")).rejects.toThrow("API ERROR 503");
  });
});
