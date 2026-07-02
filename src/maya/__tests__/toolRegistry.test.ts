// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
import { describe, it, expect, vi } from "vitest";

vi.mock("../audience.js", () => ({
  isToolAllowed: (audience: string, tool: string) => {
    const allow: Record<string, string[]> = {
      visitor: ["application.find_mine", "apply.doc_preview", "catalog.summary", "apply.start_url", "book.callback", "capital.readiness_check", "escalate.to_human", "industry.guidance", "info.lenders", "info.products", "info.qualifications", "lead.capture", "prequal.estimate", "visitor.identify", "waitlist.join"],
      client: ["application.find_mine", "application.my_status", "catalog.summary", "application.next_step", "application.resume_link", "application.timeline_estimate", "apply.field_help", "book.callback", "docs.checklist", "docs.explain", "docs.rejections", "escalate.to_human", "offer.explain", "pgi.completion_link", "signature.status"],
      staff: ["pipeline.query", "contact.find", "catalog.summary", "application.summary", "comm.draft_email", "comm.send_sms", "call.initiate", "maya.audit", "application.open_newest", "ui.navigate", "application.underwriting_summary", "lender.match_explain", "pgi.readiness", "lender.products", "contact.timeline", "call.triage", "application.risk_flags", "banking.summary", "credit.summary", "notes.read", "docs.request_draft", "daily.briefing", "crm.notes", "crm.add_note", "crm.tasks", "crm.create_task", "marketing.overview", "marketing.send_campaign"],
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
vi.mock("../tools/applicationUnderwritingSummary.js", () => ({
  applicationUnderwritingSummary: vi.fn(),
  APPLICATION_UNDERWRITING_SUMMARY_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.underwriting_summary", description: "", parameters: {} } },
}));
vi.mock("../tools/lenderMatchExplain.js", () => ({
  lenderMatchExplain: vi.fn(),
  LENDER_MATCH_EXPLAIN_TOOL_DESCRIPTOR: { type: "function", function: { name: "lender.match_explain", description: "", parameters: {} } },
}));
vi.mock("../tools/pgiReadiness.js", () => ({
  pgiReadiness: vi.fn(),
  PGI_READINESS_TOOL_DESCRIPTOR: { type: "function", function: { name: "pgi.readiness", description: "", parameters: {} } },
}));
vi.mock("../tools/catalogTools.js", () => ({
  catalogSummary: vi.fn(),
  CATALOG_SUMMARY_TOOL_DESCRIPTOR: { type: "function", function: { name: "catalog.summary", description: "", parameters: {} } },
}));
vi.mock("../tools/staffReadTools.js", () => ({
  lenderProducts: vi.fn(),
  LENDER_PRODUCTS_TOOL_DESCRIPTOR: { type: "function", function: { name: "lender.products", description: "", parameters: {} } },
  contactTimeline: vi.fn(),
  CONTACT_TIMELINE_TOOL_DESCRIPTOR: { type: "function", function: { name: "contact.timeline", description: "", parameters: {} } },
  callTriage: vi.fn(),
  CALL_TRIAGE_TOOL_DESCRIPTOR: { type: "function", function: { name: "call.triage", description: "", parameters: {} } },
  applicationRiskFlags: vi.fn(),
  APPLICATION_RISK_FLAGS_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.risk_flags", description: "", parameters: {} } },
  crmNotes: vi.fn(),
  CRM_NOTES_TOOL_DESCRIPTOR: { type: "function", function: { name: "crm.notes", description: "", parameters: {} } },
  crmAddNote: vi.fn(),
  CRM_ADD_NOTE_TOOL_DESCRIPTOR: { type: "function", function: { name: "crm.add_note", description: "", parameters: {} } },
  crmTasks: vi.fn(),
  CRM_TASKS_TOOL_DESCRIPTOR: { type: "function", function: { name: "crm.tasks", description: "", parameters: {} } },
  crmCreateTask: vi.fn(),
  CRM_CREATE_TASK_TOOL_DESCRIPTOR: { type: "function", function: { name: "crm.create_task", description: "", parameters: {} } },
  marketingOverview: vi.fn(),
  MARKETING_OVERVIEW_TOOL_DESCRIPTOR: { type: "function", function: { name: "marketing.overview", description: "", parameters: {} } },
  marketingSendCampaign: vi.fn(),
  MARKETING_SEND_CAMPAIGN_TOOL_DESCRIPTOR: { type: "function", function: { name: "marketing.send_campaign", description: "", parameters: {} } },
}));


vi.mock("../tools/staffReadTools2.js", () => ({
  bankingSummary: vi.fn(),
  BANKING_SUMMARY_TOOL_DESCRIPTOR: { type: "function", function: { name: "banking.summary", description: "", parameters: {} } },
  creditSummary: vi.fn(),
  CREDIT_SUMMARY_TOOL_DESCRIPTOR: { type: "function", function: { name: "credit.summary", description: "", parameters: {} } },
  notesRead: vi.fn(),
  NOTES_READ_TOOL_DESCRIPTOR: { type: "function", function: { name: "notes.read", description: "", parameters: {} } },
  docsRequestDraft: vi.fn(),
  DOCS_REQUEST_DRAFT_TOOL_DESCRIPTOR: { type: "function", function: { name: "docs.request_draft", description: "", parameters: {} } },
  dailyBriefing: vi.fn(),
  DAILY_BRIEFING_TOOL_DESCRIPTOR: { type: "function", function: { name: "daily.briefing", description: "", parameters: {} } },
}));

vi.mock("../tools/clientGuidanceTools.js", () => ({
  applyFieldHelp: vi.fn(),
  APPLY_FIELD_HELP_TOOL_DESCRIPTOR: { type: "function", function: { name: "apply.field_help", description: "", parameters: {} } },
  docsExplain: vi.fn(),
  DOCS_EXPLAIN_TOOL_DESCRIPTOR: { type: "function", function: { name: "docs.explain", description: "", parameters: {} } },
  docsRejections: vi.fn(),
  DOCS_REJECTIONS_TOOL_DESCRIPTOR: { type: "function", function: { name: "docs.rejections", description: "", parameters: {} } },
  offerExplain: vi.fn(),
  OFFER_EXPLAIN_TOOL_DESCRIPTOR: { type: "function", function: { name: "offer.explain", description: "", parameters: {} } },
  applicationNextStep: vi.fn(),
  APPLICATION_NEXT_STEP_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.next_step", description: "", parameters: {} } },
  signatureStatus: vi.fn(),
  SIGNATURE_STATUS_TOOL_DESCRIPTOR: { type: "function", function: { name: "signature.status", description: "", parameters: {} } },
  applicationTimelineEstimate: vi.fn(),
  APPLICATION_TIMELINE_ESTIMATE_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.timeline_estimate", description: "", parameters: {} } },
  applicationResumeLink: vi.fn(),
  APPLICATION_RESUME_LINK_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.resume_link", description: "", parameters: {} } },
}));

vi.mock("../tools/contextAndVisitorTools.js", () => ({
  capitalReadinessCheck: vi.fn(),
  CAPITAL_READINESS_CHECK_TOOL_DESCRIPTOR: { type: "function", function: { name: "capital.readiness_check", description: "", parameters: {} } },
  prequalEstimate: vi.fn(),
  PREQUAL_ESTIMATE_TOOL_DESCRIPTOR: { type: "function", function: { name: "prequal.estimate", description: "", parameters: {} } },
  industryGuidance: vi.fn(),
  INDUSTRY_GUIDANCE_TOOL_DESCRIPTOR: { type: "function", function: { name: "industry.guidance", description: "", parameters: {} } },
  applyDocPreview: vi.fn(),
  APPLY_DOC_PREVIEW_TOOL_DESCRIPTOR: { type: "function", function: { name: "apply.doc_preview", description: "", parameters: {} } },
  infoLenders: vi.fn(),
  INFO_LENDERS_TOOL_DESCRIPTOR: { type: "function", function: { name: "info.lenders", description: "", parameters: {} } },
  waitlistJoin: vi.fn(),
  WAITLIST_JOIN_TOOL_DESCRIPTOR: { type: "function", function: { name: "waitlist.join", description: "", parameters: {} } },
  applicationFindMine: vi.fn(),
  APPLICATION_FIND_MINE_TOOL_DESCRIPTOR: { type: "function", function: { name: "application.find_mine", description: "", parameters: {} } },
}));

import { TOOL_REGISTRY, descriptorsForAudience, lookupTool } from "../toolRegistry.js";

describe("AGENT_BLOCK_v5 - toolRegistry", () => {
  it("registers all fifty-three tools", () => {
    const names = Object.keys(TOOL_REGISTRY).sort();
    expect(names).toEqual([
      "application.find_mine",
      "application.my_status",
      "application.next_step",
      "application.open_newest",
      "application.resume_link",
      "application.risk_flags",
      "application.summary",
      "application.timeline_estimate",
      "application.underwriting_summary",
      "apply.doc_preview",
      "apply.field_help",
      "apply.start_url",
      "banking.summary",
      "book.callback",
      "call.initiate",
      "call.triage",
      "capital.readiness_check",
      "catalog.summary",
      "comm.draft_email",
      "comm.send_sms",
      "contact.find",
      "contact.timeline",
      "credit.summary",
      "crm.add_note",
      "crm.create_task",
      "crm.notes",
      "crm.tasks",
      "daily.briefing",
      "docs.checklist",
      "docs.explain",
      "docs.rejections",
      "docs.request_draft",
      "escalate.to_human",
      "industry.guidance",
      "info.lenders",
      "info.products",
      "info.qualifications",
      "lead.capture",
      "lender.match_explain",
      "lender.products",
      "marketing.overview",
      "marketing.send_campaign",
      "maya.audit",
      "notes.read",
      "offer.explain",
      "pgi.completion_link",
      "pgi.readiness",
      "pipeline.query",
      "prequal.estimate",
      "signature.status",
      "ui.navigate",
      "visitor.identify",
      "waitlist.join",
    ]);
  });

  it("descriptorsForAudience('visitor') exposes only visitor tools", () => {
    const names = descriptorsForAudience("visitor").map((d) => d.function.name).sort();
    expect(names).toEqual([
      "application.find_mine",
      "apply.doc_preview",
      "apply.start_url",
      "book.callback",
      "capital.readiness_check",
      "catalog.summary",
      "escalate.to_human",
      "industry.guidance",
      "info.lenders",
      "info.products",
      "info.qualifications",
      "lead.capture",
      "prequal.estimate",
      "visitor.identify",
      "waitlist.join",
    ]);
  });

  it("descriptorsForAudience('client') exposes only client tools", () => {
    const names = descriptorsForAudience("client").map((d) => d.function.name).sort();
    expect(names).toEqual([
      "application.find_mine",
      "application.my_status",
      "application.next_step",
      "application.resume_link",
      "application.timeline_estimate",
      "apply.field_help",
      "book.callback",
      "catalog.summary",
      "docs.checklist",
      "docs.explain",
      "docs.rejections",
      "escalate.to_human",
      "offer.explain",
      "pgi.completion_link",
      "signature.status",
    ]);
  });

  it("descriptorsForAudience('staff') exposes only staff tools", () => {
    const names = descriptorsForAudience("staff").map((d) => d.function.name).sort();
    expect(names).toEqual([
      "application.open_newest",
      "application.risk_flags",
      "application.summary",
      "application.underwriting_summary",
      "banking.summary",
      "call.initiate",
      "call.triage",
      "catalog.summary",
      "comm.draft_email",
      "comm.send_sms",
      "contact.find",
      "contact.timeline",
      "credit.summary",
      "crm.add_note",
      "crm.create_task",
      "crm.notes",
      "crm.tasks",
      "daily.briefing",
      "docs.request_draft",
      "lender.match_explain",
      "lender.products",
      "marketing.overview",
      "marketing.send_campaign",
      "maya.audit",
      "notes.read",
      "pgi.readiness",
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
