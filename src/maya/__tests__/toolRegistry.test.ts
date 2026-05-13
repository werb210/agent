// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
import { describe, it, expect, vi } from "vitest";

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

vi.mock("../tools/pipelineQuery.js", () => ({
  pipelineQuery: vi.fn(),
  PIPELINE_QUERY_TOOL_DESCRIPTOR: { type: "function", function: { name: "pipeline.query", description: "", parameters: {} } },
}));
vi.mock("../tools/applicationStatus.js", () => ({
  applicationStatus: vi.fn(),
  APPLICATION_STATUS_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.my_status", description: "", parameters: {} } },
}));
vi.mock("../tools/docsChecklist.js", () => ({
  docsChecklist: vi.fn(),
  DOCS_CHECKLIST_TOOL_DESCRIPTOR: { type: "function", function: { name: "docs.checklist", description: "", parameters: {} } },
}));
vi.mock("../tools/pgiCompletionLink.js", () => ({
  pgiCompletionLink: vi.fn(),
  PGI_COMPLETION_LINK_TOOL_DESCRIPTOR: { type: "function", function: { name: "pgi.completion_link", description: "", parameters: {} } },
}));
vi.mock("../tools/info.js", () => ({
  infoProducts: vi.fn(),
  INFO_PRODUCTS_TOOL_DESCRIPTOR: { type: "function", function: { name: "info.products", description: "", parameters: {} } },
  infoQualifications: vi.fn(),
  INFO_QUALIFICATIONS_TOOL_DESCRIPTOR: { type: "function", function: { name: "info.qualifications", description: "", parameters: {} } },
}));
vi.mock("../tools/leadCapture.js", () => ({
  leadCapture: vi.fn(),
  LEAD_CAPTURE_TOOL_DESCRIPTOR: { type: "function", function: { name: "lead.capture", description: "", parameters: {} } },
  applyStartUrl: vi.fn(),
  APPLY_START_URL_TOOL_DESCRIPTOR: { type: "function", function: { name: "apply.start_url", description: "", parameters: {} } },
}));

import { TOOL_REGISTRY, descriptorsForAudience, lookupTool } from "../toolRegistry.js";

describe("AGENT_BLOCK_v5 — toolRegistry", () => {
  it("registers all eight tools", () => {
    const names = Object.keys(TOOL_REGISTRY).sort();
    expect(names).toEqual([
      "application.my_status",
      "apply.start_url",
      "docs.checklist",
      "info.products",
      "info.qualifications",
      "lead.capture",
      "pgi.completion_link",
      "pipeline.query",
    ]);
  });

  it("descriptorsForAudience('visitor') exposes only visitor tools", () => {
    const names = descriptorsForAudience("visitor").map((d) => d.function.name).sort();
    expect(names).toEqual([
      "apply.start_url",
      "info.products",
      "info.qualifications",
      "lead.capture",
    ]);
  });

  it("descriptorsForAudience('client') exposes only client tools", () => {
    const names = descriptorsForAudience("client").map((d) => d.function.name).sort();
    // book.callback is in TOOLS_BY_AUDIENCE.client but not yet
    // implemented; the registry only exposes what's implemented.
    expect(names).toEqual([
      "application.my_status",
      "docs.checklist",
      "pgi.completion_link",
    ]);
  });

  it("descriptorsForAudience('staff') exposes pipeline.query at minimum", () => {
    const names = descriptorsForAudience("staff").map((d) => d.function.name);
    expect(names).toContain("pipeline.query");
  });

  it("lookupTool returns null for unknown names", () => {
    expect(lookupTool("nope.nada")).toBeNull();
  });

  it("lookupTool returns an entry for a known name", () => {
    const entry = lookupTool("pipeline.query");
    expect(entry).not.toBeNull();
    expect(entry?.descriptor.function.name).toBe("pipeline.query");
  });
});
