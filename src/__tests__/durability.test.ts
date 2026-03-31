import { pool } from "../db";
import { clearExecutedToolKeys, executeTool } from "../lib/toolExecutor";

describe("durable tool execution", () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    clearExecutedToolKeys();
  });

  it("retries and eventually succeeds", async () => {
    const querySpy = jest.spyOn(pool, "query").mockResolvedValue({ rows: [], rowCount: 0 });
    let attempts = 0;

    const result = await executeTool("call-1", "createLead", { name: "A" }, async () => {
      attempts += 1;
      if (attempts < 2) {
        throw new Error("transient");
      }

      return { ok: true };
    });

    expect(result).toEqual({ ok: true });
    expect(attempts).toBe(2);
    expect(querySpy).toHaveBeenCalled();
  });

  it("skips duplicate idempotent execution", async () => {
    jest.spyOn(pool, "query").mockResolvedValue({ rows: [], rowCount: 0 });
    const fn = jest.fn(async () => ({ ok: true }));

    await executeTool("call-2", "sendSMS", { phone: "1" }, fn);
    const second = await executeTool("call-2", "sendSMS", { phone: "1" }, fn);

    expect(fn).toHaveBeenCalledTimes(1);
    expect(second).toEqual(expect.objectContaining({ skipped: true }));
  });

  it("pushes tool failures to dead letter", async () => {
    const querySpy = jest.spyOn(pool, "query").mockResolvedValue({ rows: [], rowCount: 0 });

    await expect(
      executeTool("call-3", "updateCRMRecord", { contactId: "x" }, async () => {
        throw new Error("hard failure");
      })
    ).rejects.toThrow("hard failure");

    const calls = querySpy.mock.calls.map((entry) => String(entry[0]));
    expect(calls.some((sql) => sql.includes("maya_dead_letter"))).toBe(true);
  });
});
