// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
import { describe, it, expect, vi } from "vitest";

vi.mock("../audience.js", () => ({
  isToolAllowed: (audience: string, tool: string) => {
    const allow: Record<string, string[]> = {
      visitor: ["visitor.identify", "info.products", "info.qualifications", "lead.capture", "apply.start_url", "escalate.to_human"],
      client: ["application.my_status", "docs.checklist", "pgi.completion_link", "book.callback", "escalate.to_human"],
      staff: ["pipeline.query", "contact.find", "application.summary", "comm.draft_email", "comm.send_sms", "call.initiate", "maya.audit", "application.open_newest", "ui.navigate"],
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
vi.mock("../tools/visitorIdentify.js", () => ({
  visitorIdentify: vi.fn(),
  VISITOR_IDENTIFY_TOOL_DESCRIPTOR: { type: "function", function: { name: "visitor.identify", description: "", parameters: {} } },
}));
vi.mock("../tools/escalateToHuman.js", () => ({
  escalateToHuman: vi.fn(),
  ESCALATE_TO_HUMAN_TOOL_DESCRIPTOR: { type: "function", function: { name: "escalate.to_human", description: "", parameters: {} } },
}));

vi.mock("../tools/contactFind.js", () => ({
  contactFind: vi.fn(),
  CONTACT_FIND_TOOL_DESCRIPTOR: { type: "function", function: { name: "contact.find", description: "", parameters: {} } },
}));
vi.mock("../tools/applicationSummary.js", () => ({
  applicationSummary: vi.fn(),
  APPLICATION_SUMMARY_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.summary", description: "", parameters: {} } },
}));
vi.mock("../tools/commDraftEmail.js", () => ({
  commDraftEmail: vi.fn(),
  COMM_DRAFT_EMAIL_TOOL_DESCRIPTOR: { type: "function", function: { name: "comm.draft_email", description: "", parameters: {} } },
}));

vi.mock("../tools/mayaAudit.js", () => ({
  mayaAudit: vi.fn(),
  MAYA_AUDIT_TOOL_DESCRIPTOR: { type: "function", function: { name: "maya.audit", description: "", parameters: {} } },
}));
vi.mock("../tools/uiNavigate.js", () => ({
  uiNavigate: vi.fn(),
  UI_NAVIGATE_TOOL_DESCRIPTOR: { type: "function", function: { name: "ui.navigate", description: "", parameters: {} } },
}));
vi.mock("../tools/applicationOpenNewest.js", () => ({
  applicationOpenNewest: vi.fn(),
  APPLICATION_OPEN_NEWEST_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.open_newest", description: "", parameters: {} } },
}));
vi.mock("../tools/commSendSms.js", () => ({
  commSendSms: vi.fn(),
  COMM_SEND_SMS_TOOL_DESCRIPTOR: { type: "function", function: { name: "comm.send_sms", description: "", parameters: {} } },
}));
vi.mock("../tools/callInitiate.js", () => ({
  callInitiate: vi.fn(),
  CALL_INITIATE_TOOL_DESCRIPTOR: { type: "function", function: { name: "call.initiate", description: "", parameters: {} } },
}));
vi.mock("../tools/bookCallback.js", () => ({
  bookCallback: vi.fn(),
  BOOK_CALLBACK_TOOL_DESCRIPTOR: { type: "function", function: { name: "book.callback", description: "", parameters: {} } },
}));

import { TOOL_REGISTRY, descriptorsForAudience, lookupTool } from "../toolRegistry.js";

describe("AGENT_BLOCK_v5 — toolRegistry", () => {
  it("registers all nineteen tools", () => {
    const names = Object.keys(TOOL_REGISTRY).sort();
    expect(names).toEqual([
      "application.my_status",
      "application.open_newest",
      "application.summary",
      "apply.start_url",
      "book.callback",
      "call.initiate",
      "comm.draft_email",
      "comm.send_sms",
      "contact.find",
      "docs.checklist",
      "escalate.to_human",
      "info.products",
      "info.qualifications",
      "lead.capture",
      "maya.audit",
      "pgi.completion_link",
      "pipeline.query",
      "ui.navigate",
      "visitor.identify",
    ]);
  });

  it("descriptorsForAudience('visitor') exposes only visitor tools", () => {
    const names = descriptorsForAudience("visitor").map((d) => d.function.name).sort();
    expect(names).toEqual([
      "apply.start_url",
      "escalate.to_human",
      "info.products",
      "info.qualifications",
      "lead.capture",
      "visitor.identify",
    ]);
  });

  it("descriptorsForAudience('client') exposes only client tools", () => {
    const names = descriptorsForAudience("client").map((d) => d.function.name).sort();
    expect(names).toEqual([
      "application.my_status",
      "book.callback",
      "docs.checklist",
      "escalate.to_human",
      "pgi.completion_link",
    ]);
  });

  it("descriptorsForAudience('staff') exposes only staff tools", () => {
    const names = descriptorsForAudience("staff").map((d) => d.function.name).sort();
    expect(names).toEqual([
      "application.open_newest",
      "application.summary",
      "call.initiate",
      "comm.draft_email",
      "comm.send_sms",
      "contact.find",
      "maya.audit",
      "pipeline.query",
      "ui.navigate",
    ]);
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
