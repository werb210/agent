import { clearToken, getTokenOrFail, saveToken } from "../src/services/token";
import { api } from "../src/lib/api";

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

  it("API call returns status ok payload", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({
      json: async () => ({ status: "ok", data: { ok: true } })
    }));

    await expect(api("/api/ping")).resolves.toEqual({ ok: true });
  });

  it("request can include bearer token header", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({
      json: async () => ({ status: "ok", data: { ok: true } })
    }));

    await api("/api/ping", {
      method: "POST",
      headers: { Authorization: "Bearer valid-token" },
      body: { ping: true },
    });

    const fetchArgs = ((globalThis as any).fetch as ReturnType<typeof jest.fn>).mock.calls[0];
    expect(fetchArgs[1].headers.Authorization).toBe("Bearer valid-token");
    expect(fetchArgs[1].headers["Content-Type"]).toBe("application/json");
    expect(fetchArgs[1].body).toBe(JSON.stringify({ ping: true }));
  });
});
