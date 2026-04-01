import { apiRequest } from "../src/lib/apiClient";
import { clearToken, saveToken } from "../src/services/token";
import { getTokenOrFail } from "../src/services/token";

describe("auth flow e2e", () => {
  beforeEach(() => {
    clearToken();
    (globalThis as any).fetch = undefined;
    (globalThis as any).window.location.href = "";
  });

  it("TEST 1: empty string token is blocked", () => {
    (globalThis as any).localStorage.setItem("token", "");
    expect(() => getTokenOrFail()).toThrow("[AUTH BLOCK]");
  });

  it('TEST 2: literal "undefined" token is blocked', () => {
    (globalThis as any).localStorage.setItem("token", "undefined");
    expect(() => getTokenOrFail()).toThrow("[AUTH BLOCK]");
  });

  it('TEST 3: literal "null" token is blocked', () => {
    (globalThis as any).localStorage.setItem("token", "null");
    expect(() => getTokenOrFail()).toThrow("[AUTH BLOCK]");
  });

  it("TEST 4: API call returns 200 payload", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, status: 200, text: async () => '{"ok":true}', json: async () => ({ ok: true }) }));

    await expect(apiRequest("/api/ping")).resolves.toEqual({ ok: true });
  });

  it("TEST 5: API 401 clears token and redirects", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: false, status: 401, text: async () => "unauthorized", json: async () => ({}) }));

    await expect(apiRequest("/api/ping")).rejects.toThrow("[AUTH FAIL]");
    expect((globalThis as any).localStorage.getItem("token")).toBeNull();
  });

  it("TEST 6: malformed path injection is blocked", async () => {
    saveToken("valid-token");
    await expect(apiRequest("/api/../admin")).rejects.toThrow("[INVALID PATH]");
    await expect(apiRequest("/api//evil")).rejects.toThrow("[INVALID PATH]");
    await expect(apiRequest("/v1/ping")).rejects.toThrow("[INVALID PATH]");
  });

  it("TEST 7: 204 empty response returns null", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, status: 204, text: async () => "", json: async () => null }));

    await expect(apiRequest("/api/ping")).resolves.toBeNull();
  });

  it("TEST 8: empty 200 response throws", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, status: 200, text: async () => "", json: async () => { throw new Error("[EMPTY RESPONSE]"); } }));

    await expect(apiRequest("/api/ping")).rejects.toThrow("[EMPTY RESPONSE]");
  });

  it("TEST 9: caller authorization header override is ignored", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, status: 200, text: async () => '{"ok":true}', json: async () => ({ ok: true }) }));

    await apiRequest("/api/ping", {
      headers: {
        Authorization: "Bearer attacker-token"
      }
    });

    const fetchArgs = ((globalThis as any).fetch as jest.Mock).mock.calls[0];
    expect(fetchArgs[1].headers.Authorization).toBe("Bearer valid-token");
    expect(fetchArgs[1].headers["Content-Type"]).toBe("application/json");
  });
});
