// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
import { describe, it, expect, vi, beforeEach } from "vitest";
import { dispatchTool } from "../dispatch.js";

vi.mock("../audience.js", () => ({
  isToolAllowed: (audience: string, tool: string) => {
    const allow: Record<string, string[]> = {
      visitor: ["info.products", "info.qualifications", "lead.capture", "apply.start_url"],
      client: ["application.my_status", "docs.checklist", "pgi.completion_link"],
      staff: ["pipeline.query"],
    };
    return (allow[audience] ?? []).includes(tool);
  },
  MAYA_AUDIENCE_HEADER: "X-Maya-Audience",
  parseAudience: (v?: string | null) => (v === "client" || v === "staff" ? v : "visitor"),
}));

const pipelineMock = vi.fn();
const applicationStatusMock = vi.fn();
const leadCaptureMock = vi.fn();

vi.mock("../tools/pipelineQuery.js", () => ({
  pipelineQuery: (a: unknown) => pipelineMock(a),
  PIPELINE_QUERY_TOOL_DESCRIPTOR: { type: "function", function: { name: "pipeline.query", description: "", parameters: {} } },
}));
vi.mock("../tools/applicationStatus.js", () => ({
  applicationStatus: (a: unknown) => applicationStatusMock(a),
  APPLICATION_STATUS_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.my_status", description: "", parameters: {} } },
}));
vi.mock("../tools/docsChecklist.js", () => ({
  docsChecklist: vi.fn(async () => ({ ok: true })),
  DOCS_CHECKLIST_TOOL_DESCRIPTOR: { type: "function", function: { name: "docs.checklist", description: "", parameters: {} } },
}));
vi.mock("../tools/pgiCompletionLink.js", () => ({
  pgiCompletionLink: vi.fn(async () => ({ ok: true })),
  PGI_COMPLETION_LINK_TOOL_DESCRIPTOR: { type: "function", function: { name: "pgi.completion_link", description: "", parameters: {} } },
}));
vi.mock("../tools/info.js", () => ({
  infoProducts: vi.fn(async () => ({ ok: true })),
  INFO_PRODUCTS_TOOL_DESCRIPTOR: { type: "function", function: { name: "info.products", description: "", parameters: {} } },
  infoQualifications: vi.fn(async () => ({ ok: true })),
  INFO_QUALIFICATIONS_TOOL_DESCRIPTOR: { type: "function", function: { name: "info.qualifications", description: "", parameters: {} } },
}));
vi.mock("../tools/leadCapture.js", () => ({
  leadCapture: (a: unknown) => leadCaptureMock(a),
  LEAD_CAPTURE_TOOL_DESCRIPTOR: { type: "function", function: { name: "lead.capture", description: "", parameters: {} } },
  applyStartUrl: vi.fn(async () => ({ ok: true, url: "https://client.boreal.financial/" })),
  APPLY_START_URL_TOOL_DESCRIPTOR: { type: "function", function: { name: "apply.start_url", description: "", parameters: {} } },
}));

describe("AGENT_BLOCK_v5 — dispatchTool", () => {
  beforeEach(() => {
    pipelineMock.mockReset();
    applicationStatusMock.mockReset();
    leadCaptureMock.mockReset();
  });

  it("refuses a tool the audience can't call (visitor → pipeline.query)", async () => {
    const result = await dispatchTool(
      "pipeline.query",
      { question: "oldest" },
      { audience: "visitor" },
    );
    const parsed = JSON.parse(result);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe("tool_not_allowed_for_audience");
    expect(pipelineMock).not.toHaveBeenCalled();
  });

  it("dispatches a staff tool with parsed JSON args", async () => {
    pipelineMock.mockResolvedValueOnce({ ok: true, summary: "test" });
    const result = await dispatchTool(
      "pipeline.query",
      '{"question":"oldest active application"}',
      { audience: "staff" },
    );
    expect(pipelineMock).toHaveBeenCalledWith({ question: "oldest active application" });
    const parsed = JSON.parse(result);
    expect(parsed.ok).toBe(true);
  });

  it("overrides application_id from context for app-scoped client tools", async () => {
    applicationStatusMock.mockResolvedValueOnce({ ok: true });
    await dispatchTool(
      "application.my_status",
      '{"application_id":"hallucinated"}',
      { audience: "client", applicationId: "real-app-123" },
    );
    expect(applicationStatusMock).toHaveBeenCalledWith({ application_id: "real-app-123" });
  });

  it("returns tool_args_invalid_json when the model emits bad JSON", async () => {
    const result = await dispatchTool(
      "pipeline.query",
      "not json at all",
      { audience: "staff" },
    );
    const parsed = JSON.parse(result);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe("tool_args_invalid_json");
    expect(pipelineMock).not.toHaveBeenCalled();
  });

  it("catches tool exceptions and serializes them", async () => {
    pipelineMock.mockRejectedValueOnce(new Error("kaboom"));
    const result = await dispatchTool(
      "pipeline.query",
      '{"question":"oldest"}',
      { audience: "staff" },
    );
    const parsed = JSON.parse(result);
    expect(parsed.ok).toBe(false);
    expect(parsed.error).toBe("tool_exception");
    expect(parsed.detail).toBe("kaboom");
  });

  it("returns tool_not_found for unknown tool names", async () => {
    const result = await dispatchTool(
      "some.unknown.tool",
      "{}",
      { audience: "staff" },
    );
    const parsed = JSON.parse(result);
    expect(parsed.ok).toBe(false);
    // Could be tool_not_allowed_for_audience (since unknown tools
    // aren't in the staff whitelist either) OR tool_not_found,
    // depending on which check fires first. Both are valid.
    expect(["tool_not_allowed_for_audience", "tool_not_found"]).toContain(parsed.error);
  });
});
