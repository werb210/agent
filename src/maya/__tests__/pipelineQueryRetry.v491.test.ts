// AGENT_BLOCK_v491_MAYA_TRIES_BEFORE_DECLINING
import { describe, it, expect, vi, beforeEach } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const { callBFServer } = vi.hoisted(() => ({ callBFServer: vi.fn() }));
vi.mock("../../integrations/bfServerClient.js", () => ({ callBFServer }));

import { pipelineQuery, closestSupported } from "../tools/pipelineQuery.js";

const supported = [
  { key: "oldest_active", label: "oldest active application" },
  { key: "approvals_this_week", label: "approvals this week" },
  { key: "missing_bank_statements", label: "apps missing bank statements" },
];

describe("v491 pipeline.query tries before declining", () => {
  beforeEach(() => callBFServer.mockReset());

  it("picks the closest supported report", () => {
    expect(closestSupported("which files are missing their bank statements?", supported)?.key).toBe("missing_bank_statements");
    expect(closestSupported("what's the weather", supported)).toBeNull();
  });

  it("retries once with the closest report", async () => {
    callBFServer
      .mockResolvedValueOnce({ ok: true, not_supported: true, supported_queries: supported })
      .mockResolvedValueOnce({ ok: true, rows: [{ id: "a1" }], summary: "1 application missing bank statements." });
    const r = await pipelineQuery({ question: "who still owes us bank statements" });
    expect(callBFServer).toHaveBeenCalledTimes(2);
    expect(callBFServer.mock.calls[1][1].body.question).toBe("apps missing bank statements");
    expect(r.rows?.length).toBe(1);
    expect(r.summary).toContain("Closest report I can run");
  });

  it("lists the reports when nothing is close", async () => {
    callBFServer.mockResolvedValueOnce({ ok: true, not_supported: true, supported_queries: supported });
    const r = await pipelineQuery({ question: "what is the weather" });
    expect(callBFServer).toHaveBeenCalledTimes(1);
    expect(r.summary).toContain("Reports I can run: oldest active application; approvals this week; apps missing bank statements");
  });

  it("staff prompt tells Maya to use the marketing and briefing tools", () => {
    const src = readFileSync(resolve(__dirname, "../../api/maya.ts"), "utf8");
    expect(src).toContain("use marketing.overview for marketing");
    expect(src).toContain("daily.briefing for 'what's on today'");
  });
});
