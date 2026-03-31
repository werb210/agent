import { apiRequest } from "../src/lib/apiClient";
import { enforceStartupAuth } from "../src/app/bootstrap";
import { clearToken, saveToken } from "../src/services/token";

describe("auth flow e2e", () => {
  const originalNodeEnv = process.env.NODE_ENV;

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
  });

  beforeEach(() => {
    clearToken();
    (globalThis as any).window.location.href = "";
  });

  it("TEST 1: no token blocks bootstrap outside test env", () => {
    process.env.NODE_ENV = "production";
    expect(() => enforceStartupAuth()).toThrow("[BOOT BLOCKED]");
  });

  it("TEST 2: test env allows bootstrap", () => {
    process.env.NODE_ENV = "test";
    expect(() => enforceStartupAuth()).not.toThrow();
  });

  it("TEST 3: API call returns 200 payload", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, status: 200, text: async () => '{"ok":true}' }));

    await expect(apiRequest("/api/ping")).resolves.toEqual({ ok: true });
  });

  it("TEST 4: API 401 clears token and redirects", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: false, status: 401, text: async () => "unauthorized" }));

    await expect(apiRequest("/api/ping")).rejects.toThrow("[AUTH FAIL]");
    expect((globalThis as any).localStorage.getItem("token")).toBeNull();
  });

  it("TEST 5: invalid path is blocked", async () => {
    saveToken("valid-token");
    await expect(apiRequest("/v1/ping")).rejects.toThrow("[INVALID API PATH]");
  });

  it("TEST 6: empty response throws", async () => {
    saveToken("valid-token");
    (globalThis as any).fetch = jest.fn(async () => ({ ok: true, status: 200, text: async () => "" }));

    await expect(apiRequest("/api/ping")).rejects.toThrow("[EMPTY RESPONSE]");
  });
});
