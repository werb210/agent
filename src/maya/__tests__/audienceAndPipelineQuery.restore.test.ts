// AGENT_HOTFIX_v5a_RESTORE_AUDIENCE_AND_PIPELINE_QUERY_v1
// Verify the restored exports compile and behave as v5 expects.
import { describe, it, expect, vi, beforeEach } from "vitest";

const callMock = vi.fn();
vi.mock("../../integrations/bfServerClient.js", () => ({
  callBFServer: (...args: unknown[]) => callMock(...args),
}));

import {
  parseAudience,
  isToolAllowed,
  MAYA_AUDIENCE_HEADER,
  TOOLS_BY_AUDIENCE,
  type MayaAudience,
} from "../audience.js";
import {
  pipelineQuery,
  PIPELINE_QUERY_TOOL_DESCRIPTOR,
} from "../tools/pipelineQuery.js";

describe("AGENT_HOTFIX_v5a — audience", () => {
  it("MAYA_AUDIENCE_HEADER is the lowercase header name", () => {
    expect(MAYA_AUDIENCE_HEADER).toBe("x-maya-audience");
  });

  it("parseAudience accepts all three canonical values", () => {
    expect(parseAudience("staff")).toBe("staff");
    expect(parseAudience("client")).toBe("client");
    expect(parseAudience("visitor")).toBe("visitor");
  });

  it("parseAudience is case-insensitive", () => {
    expect(parseAudience("STAFF")).toBe("staff");
    expect(parseAudience(" Client ")).toBe("client");
  });

  it("parseAudience defaults to visitor on missing/unknown/garbage", () => {
    expect(parseAudience(undefined)).toBe("visitor");
    expect(parseAudience("admin")).toBe("visitor");
    expect(parseAudience("")).toBe("visitor");
  });

  it("parseAudience handles array headers (Express edge case)", () => {
    expect(parseAudience(["staff", "client"])).toBe("staff");
  });

  it("TOOLS_BY_AUDIENCE has the locked tool lists for each audience", () => {
    const a: ReadonlyArray<MayaAudience> = ["visitor", "client", "staff"];
    for (const x of a) expect(TOOLS_BY_AUDIENCE[x].length).toBeGreaterThan(0);
    expect(TOOLS_BY_AUDIENCE.visitor).toContain("info.products");
    expect(TOOLS_BY_AUDIENCE.visitor).toContain("apply.start_url");
    expect(TOOLS_BY_AUDIENCE.client).toContain("application.my_status");
    expect(TOOLS_BY_AUDIENCE.client).toContain("pgi.completion_link");
    expect(TOOLS_BY_AUDIENCE.staff).toContain("pipeline.query");
  });

  it("isToolAllowed enforces the whitelist (no cross-audience access)", () => {
    expect(isToolAllowed("visitor", "info.products")).toBe(true);
    expect(isToolAllowed("visitor", "pipeline.query")).toBe(false);
    expect(isToolAllowed("client", "application.my_status")).toBe(true);
    expect(isToolAllowed("client", "pipeline.query")).toBe(false);
    expect(isToolAllowed("staff", "pipeline.query")).toBe(true);
    expect(isToolAllowed("staff", "lead.capture")).toBe(false);
  });

  it("isToolAllowed returns false for unknown tool names", () => {
    expect(isToolAllowed("staff", "made.up")).toBe(false);
  });
});

describe("AGENT_HOTFIX_v5a — pipelineQuery", () => {
  beforeEach(() => callMock.mockReset());

  it("returns error on missing question", async () => {
    const r = await pipelineQuery({ question: "" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("question_required");
    expect(callMock).not.toHaveBeenCalled();
  });

  it("forwards question + session_id to BF-Server POST endpoint", async () => {
    callMock.mockResolvedValueOnce({
      ok: true,
      query: "oldest_active_application",
      label: "Oldest active application",
      rows: [{ id: "a1" }],
      summary: "Oldest is a1.",
    });
    const r = await pipelineQuery({
      question: "what's the oldest active application",
      session_id: "sess-42",
    });
    expect(r.ok).toBe(true);
    expect(r.query).toBe("oldest_active_application");
    expect(callMock).toHaveBeenCalledTimes(1);
    const [path, opts] = callMock.mock.calls[0];
    expect(path).toBe("/api/maya/staff/pipeline-query");
    expect(opts).toMatchObject({
      method: "POST",
      body: expect.objectContaining({
        question: "what's the oldest active application",
        session_id: "sess-42",
      }),
    });
  });

  it("returns ok=false on transport error", async () => {
    callMock.mockRejectedValueOnce(new Error("network"));
    const r = await pipelineQuery({ question: "oldest" });
    expect(r.ok).toBe(false);
    expect(r.error).toBe("pipeline_query_failed");
    expect(r.summary).toContain("network");
  });

  it("descriptor advertises the correct name + required arg", () => {
    expect(PIPELINE_QUERY_TOOL_DESCRIPTOR.function.name).toBe("pipeline.query");
    expect(
      (PIPELINE_QUERY_TOOL_DESCRIPTOR.function.parameters as any).required,
    ).toEqual(["question"]);
  });
});
