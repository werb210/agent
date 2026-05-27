import { describe, expect, it, vi } from "vitest";
import { auditRequiredEnv } from "../app.js";

describe("AGENT_BLOCK_v20_BOOT_CONFIG_AUDIT_v1", () => {
  it("logs agent_boot_missing_env when required env vars are missing", () => {
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const missing = auditRequiredEnv({} as NodeJS.ProcessEnv);

    expect(missing.length).toBeGreaterThan(0);
    expect(errSpy).toHaveBeenCalledWith(expect.stringContaining("agent_boot_missing_env"));
    errSpy.mockRestore();
  });
});
