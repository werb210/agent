import { checkHealth } from "../src/health";
import { pool } from "../src/db";

describe("maya runtime regression guard", () => {
  beforeEach(() => {
    vi.spyOn(pool, "query").mockResolvedValue({ rows: [{ ok: 1 }], rowCount: 1 });
  });

  it("stays deterministic without network probing", async () => {
    await expect(checkHealth()).resolves.toEqual({ status: "ok" });
  });

  it("fails when handlers are not loaded", async () => {
    const mod = await import("../src/ai/toolExecutor");
    const handlers = vi.spyOn(mod, "areToolHandlersLoaded");
    handlers.mockReturnValue(false);

    await expect(checkHealth()).rejects.toThrow("HANDLERS_NOT_READY");

    handlers.mockRestore();
  });
});
