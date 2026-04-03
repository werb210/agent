import { clearToken, getTokenOrFail, saveToken } from "../src/services/token";
import { apiFetch } from "../src/utils/apiClient";

describe("auth flow e2e", () => {
  beforeEach(() => {
    clearToken();
    (globalThis as any).fetch = undefined;
    (globalThis as any).window.location.href = "";
  });

  it("empty string token is blocked", () => {
    (globalThis as any).localStorage.setItem("token", "");
    expect(() => getTokenOrFail()).toThrow("[AUTH BLOCK]");
  });

  it('literal "undefined" token is blocked', () => {
    (globalThis as any).localStorage.setItem("token", "undefined");
    expect(() => getTokenOrFail()).toThrow("[AUTH BLOCK]");
  });

  it('literal "null" token is blocked', () => {
    (globalThis as any).localStorage.setItem("token", "null");
    expect(() => getTokenOrFail()).toThrow("[AUTH BLOCK]");
  });

  it("API call returns payload", async () => {
    saveToken("valid-token");
    process.env.AGENT_API_TOKEN = "valid-token";
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => "",
    }));

    await expect(apiFetch("/api/ping")).resolves.toEqual({ ok: true });
  });

  it("request can include bearer token header", async () => {
    saveToken("valid-token");
    process.env.AGENT_API_TOKEN = "valid-token";
    (globalThis as any).fetch = vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
      text: async () => "",
    }));

    await apiFetch("/api/ping", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
      body: JSON.stringify({ ping: true }),
    });

    const fetchArgs = ((globalThis as any).fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(fetchArgs[1].headers.Authorization).toBe("Bearer valid-token");
    expect(fetchArgs[1].headers["Content-Type"]).toBe("application/json");
    expect(fetchArgs[1].body).toBe(JSON.stringify({ ping: true }));
  });
});
