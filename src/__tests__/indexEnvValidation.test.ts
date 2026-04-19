import { describe, expect, it, vi } from "vitest";
import { validateProductionEnv } from "../index.js";

describe("index production env validation", () => {
  it("warns and does not throw when AGENT_API_TOKEN is missing in production", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    expect(() =>
      validateProductionEnv({
        NODE_ENV: "production",
        JWT_SECRET: "jwt-secret",
        AGENT_SHARED_SECRET: "shared-secret",
      } as any),
    ).not.toThrow();

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining("AGENT_API_TOKEN is not set or is test_token"));
    warnSpy.mockRestore();
  });
});
