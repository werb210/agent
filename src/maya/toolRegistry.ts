// AGENT_BLOCK_v5_CHAT_TOOL_DISPATCH_v1
// Central registry that maps a tool name to its descriptor (for
// OpenAI function-calling) and its runtime function. The chat
// pipeline filters this registry by audience before exposing
// descriptors to the model, and uses it to dispatch tool_calls
// back to real handlers.
import { isToolAllowed, type MayaAudience } from "./audience.js";
import { pipelineQuery, PIPELINE_QUERY_TOOL_DESCRIPTOR } from "./tools/pipelineQuery.js";
import { applicationStatus, APPLICATION_STATUS_TOOL_DESCRIPTOR } from "./tools/applicationStatus.js";
import { docsChecklist, DOCS_CHECKLIST_TOOL_DESCRIPTOR } from "./tools/docsChecklist.js";
import { pgiCompletionLink, PGI_COMPLETION_LINK_TOOL_DESCRIPTOR } from "./tools/pgiCompletionLink.js";
import { infoProducts, INFO_PRODUCTS_TOOL_DESCRIPTOR, infoQualifications, INFO_QUALIFICATIONS_TOOL_DESCRIPTOR } from "./tools/info.js";
import { leadCapture, LEAD_CAPTURE_TOOL_DESCRIPTOR, applyStartUrl, APPLY_START_URL_TOOL_DESCRIPTOR } from "./tools/leadCapture.js";
import { visitorIdentify, VISITOR_IDENTIFY_TOOL_DESCRIPTOR } from "./tools/visitorIdentify.js";
import { escalateToHuman, ESCALATE_TO_HUMAN_TOOL_DESCRIPTOR } from "./tools/escalateToHuman.js";
import { contactFind, CONTACT_FIND_TOOL_DESCRIPTOR } from "./tools/contactFind.js";
import { applicationSummary, APPLICATION_SUMMARY_TOOL_DESCRIPTOR } from "./tools/applicationSummary.js";
import { commDraftEmail, COMM_DRAFT_EMAIL_TOOL_DESCRIPTOR } from "./tools/commDraftEmail.js";
import { mayaAudit, MAYA_AUDIT_TOOL_DESCRIPTOR } from "./tools/mayaAudit.js";
import { uiNavigate, UI_NAVIGATE_TOOL_DESCRIPTOR } from "./tools/uiNavigate.js";
import { applicationOpenNewest, APPLICATION_OPEN_NEWEST_TOOL_DESCRIPTOR } from "./tools/applicationOpenNewest.js";
import { commSendSms, COMM_SEND_SMS_TOOL_DESCRIPTOR } from "./tools/commSendSms.js";
import { callInitiate, CALL_INITIATE_TOOL_DESCRIPTOR } from "./tools/callInitiate.js";
import { bookCallback, BOOK_CALLBACK_TOOL_DESCRIPTOR } from "./tools/bookCallback.js";
import { applicationUnderwritingSummary, APPLICATION_UNDERWRITING_SUMMARY_TOOL_DESCRIPTOR } from "./tools/applicationUnderwritingSummary.js";
import { lenderMatchExplain, LENDER_MATCH_EXPLAIN_TOOL_DESCRIPTOR } from "./tools/lenderMatchExplain.js";
import { pgiReadiness, PGI_READINESS_TOOL_DESCRIPTOR } from "./tools/pgiReadiness.js";
import {
  capitalReadinessCheck, CAPITAL_READINESS_CHECK_TOOL_DESCRIPTOR,
  prequalEstimate, PREQUAL_ESTIMATE_TOOL_DESCRIPTOR,
  industryGuidance, INDUSTRY_GUIDANCE_TOOL_DESCRIPTOR,
  applyDocPreview, APPLY_DOC_PREVIEW_TOOL_DESCRIPTOR,
  infoLenders, INFO_LENDERS_TOOL_DESCRIPTOR,
  waitlistJoin, WAITLIST_JOIN_TOOL_DESCRIPTOR,
  applicationFindMine, APPLICATION_FIND_MINE_TOOL_DESCRIPTOR,
} from "./tools/contextAndVisitorTools.js";
import {
  applyFieldHelp, APPLY_FIELD_HELP_TOOL_DESCRIPTOR,
  docsExplain, DOCS_EXPLAIN_TOOL_DESCRIPTOR,
  docsRejections, DOCS_REJECTIONS_TOOL_DESCRIPTOR,
  offerExplain, OFFER_EXPLAIN_TOOL_DESCRIPTOR,
  applicationNextStep, APPLICATION_NEXT_STEP_TOOL_DESCRIPTOR,
  signatureStatus, SIGNATURE_STATUS_TOOL_DESCRIPTOR,
  applicationTimelineEstimate, APPLICATION_TIMELINE_ESTIMATE_TOOL_DESCRIPTOR,
  applicationResumeLink, APPLICATION_RESUME_LINK_TOOL_DESCRIPTOR,
} from "./tools/clientGuidanceTools.js";
import {
  lenderProducts, LENDER_PRODUCTS_TOOL_DESCRIPTOR,
  contactTimeline, CONTACT_TIMELINE_TOOL_DESCRIPTOR,
  callTriage, CALL_TRIAGE_TOOL_DESCRIPTOR,
  applicationRiskFlags, APPLICATION_RISK_FLAGS_TOOL_DESCRIPTOR,
} from "./tools/staffReadTools.js";
import {
  bankingSummary, BANKING_SUMMARY_TOOL_DESCRIPTOR,
  creditSummary, CREDIT_SUMMARY_TOOL_DESCRIPTOR,
  notesRead, NOTES_READ_TOOL_DESCRIPTOR,
  docsRequestDraft, DOCS_REQUEST_DRAFT_TOOL_DESCRIPTOR,
  dailyBriefing, DAILY_BRIEFING_TOOL_DESCRIPTOR,
} from "./tools/staffReadTools2.js";

export type ToolDescriptor = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolEntry = {
  descriptor: ToolDescriptor;
  run: (args: any) => Promise<unknown>;
};

export const TOOL_REGISTRY: Readonly<Record<string, ToolEntry>> = {
  "pipeline.query":         { descriptor: PIPELINE_QUERY_TOOL_DESCRIPTOR,         run: (a) => pipelineQuery(a) },
  "application.my_status":  { descriptor: APPLICATION_STATUS_TOOL_DESCRIPTOR,     run: (a) => applicationStatus(a) },
  "docs.checklist":         { descriptor: DOCS_CHECKLIST_TOOL_DESCRIPTOR,         run: (a) => docsChecklist(a) },
  "pgi.completion_link":    { descriptor: PGI_COMPLETION_LINK_TOOL_DESCRIPTOR,    run: (a) => pgiCompletionLink(a) },
  "info.products":          { descriptor: INFO_PRODUCTS_TOOL_DESCRIPTOR,          run: (a) => infoProducts(a) },
  "info.qualifications":    { descriptor: INFO_QUALIFICATIONS_TOOL_DESCRIPTOR,    run: (a) => infoQualifications(a) },
  "lead.capture":           { descriptor: LEAD_CAPTURE_TOOL_DESCRIPTOR,           run: (a) => leadCapture(a) },
  "apply.start_url":        { descriptor: APPLY_START_URL_TOOL_DESCRIPTOR,        run: (a) => applyStartUrl(a) },
  "visitor.identify":        { descriptor: VISITOR_IDENTIFY_TOOL_DESCRIPTOR,       run: (a) => visitorIdentify(a) },
  "escalate.to_human":       { descriptor: ESCALATE_TO_HUMAN_TOOL_DESCRIPTOR,      run: (a) => escalateToHuman(a) },
  "contact.find":            { descriptor: CONTACT_FIND_TOOL_DESCRIPTOR,          run: (a) => contactFind(a) },
  "application.summary":     { descriptor: APPLICATION_SUMMARY_TOOL_DESCRIPTOR,   run: (a) => applicationSummary(a) },
  "comm.draft_email":        { descriptor: COMM_DRAFT_EMAIL_TOOL_DESCRIPTOR,      run: (a) => commDraftEmail(a) },
  "maya.audit":              { descriptor: MAYA_AUDIT_TOOL_DESCRIPTOR,            run: (a) => mayaAudit(a) },
  "application.open_newest": { descriptor: APPLICATION_OPEN_NEWEST_TOOL_DESCRIPTOR, run: (a) => applicationOpenNewest(a) },
  "ui.navigate":             { descriptor: UI_NAVIGATE_TOOL_DESCRIPTOR,           run: (a) => uiNavigate(a) },
  "comm.send_sms":           { descriptor: COMM_SEND_SMS_TOOL_DESCRIPTOR,         run: (a) => commSendSms(a) },
  "call.initiate":           { descriptor: CALL_INITIATE_TOOL_DESCRIPTOR,         run: (a) => callInitiate(a) },
  "book.callback":           { descriptor: BOOK_CALLBACK_TOOL_DESCRIPTOR,         run: (a) => bookCallback(a) },
  "application.underwriting_summary": { descriptor: APPLICATION_UNDERWRITING_SUMMARY_TOOL_DESCRIPTOR, run: (a) => applicationUnderwritingSummary(a) },
  "lender.match_explain": { descriptor: LENDER_MATCH_EXPLAIN_TOOL_DESCRIPTOR, run: (a) => lenderMatchExplain(a) },
  "pgi.readiness": { descriptor: PGI_READINESS_TOOL_DESCRIPTOR, run: (a) => pgiReadiness(a) },
  "apply.field_help": { descriptor: APPLY_FIELD_HELP_TOOL_DESCRIPTOR, run: (a) => applyFieldHelp(a) },
  "docs.explain": { descriptor: DOCS_EXPLAIN_TOOL_DESCRIPTOR, run: (a) => docsExplain(a) },
  "docs.rejections": { descriptor: DOCS_REJECTIONS_TOOL_DESCRIPTOR, run: (a) => docsRejections(a) },
  "offer.explain": { descriptor: OFFER_EXPLAIN_TOOL_DESCRIPTOR, run: (a) => offerExplain(a) },
  "application.next_step": { descriptor: APPLICATION_NEXT_STEP_TOOL_DESCRIPTOR, run: (a) => applicationNextStep(a) },
  "signature.status": { descriptor: SIGNATURE_STATUS_TOOL_DESCRIPTOR, run: (a) => signatureStatus(a) },
  "application.timeline_estimate": { descriptor: APPLICATION_TIMELINE_ESTIMATE_TOOL_DESCRIPTOR, run: (a) => applicationTimelineEstimate(a) },
  "application.resume_link": { descriptor: APPLICATION_RESUME_LINK_TOOL_DESCRIPTOR, run: (a) => applicationResumeLink(a) },
  "lender.products": { descriptor: LENDER_PRODUCTS_TOOL_DESCRIPTOR, run: (a) => lenderProducts(a) },
  "contact.timeline": { descriptor: CONTACT_TIMELINE_TOOL_DESCRIPTOR, run: (a) => contactTimeline(a) },
  "call.triage": { descriptor: CALL_TRIAGE_TOOL_DESCRIPTOR, run: (a) => callTriage(a) },
  "application.risk_flags": { descriptor: APPLICATION_RISK_FLAGS_TOOL_DESCRIPTOR, run: (a) => applicationRiskFlags(a) },
  "banking.summary": { descriptor: BANKING_SUMMARY_TOOL_DESCRIPTOR, run: (a) => bankingSummary(a) },
  "credit.summary": { descriptor: CREDIT_SUMMARY_TOOL_DESCRIPTOR, run: (a) => creditSummary(a) },
  "notes.read": { descriptor: NOTES_READ_TOOL_DESCRIPTOR, run: (a) => notesRead(a) },
  "docs.request_draft": { descriptor: DOCS_REQUEST_DRAFT_TOOL_DESCRIPTOR, run: (a) => docsRequestDraft(a) },
  "daily.briefing": { descriptor: DAILY_BRIEFING_TOOL_DESCRIPTOR, run: (a) => dailyBriefing(a) },
  "capital.readiness_check": { descriptor: CAPITAL_READINESS_CHECK_TOOL_DESCRIPTOR, run: (a) => capitalReadinessCheck(a) },
  "prequal.estimate": { descriptor: PREQUAL_ESTIMATE_TOOL_DESCRIPTOR, run: (a) => prequalEstimate(a) },
  "industry.guidance": { descriptor: INDUSTRY_GUIDANCE_TOOL_DESCRIPTOR, run: (a) => industryGuidance(a) },
  "apply.doc_preview": { descriptor: APPLY_DOC_PREVIEW_TOOL_DESCRIPTOR, run: (a) => applyDocPreview(a) },
  "info.lenders": { descriptor: INFO_LENDERS_TOOL_DESCRIPTOR, run: () => infoLenders() },
  "waitlist.join": { descriptor: WAITLIST_JOIN_TOOL_DESCRIPTOR, run: (a) => waitlistJoin(a) },
  "application.find_mine": { descriptor: APPLICATION_FIND_MINE_TOOL_DESCRIPTOR, run: (a) => applicationFindMine(a) },
};

export function descriptorsForAudience(audience: MayaAudience): ToolDescriptor[] {
  return Object.entries(TOOL_REGISTRY)
    .filter(([name]) => isToolAllowed(audience, name))
    .map(([, entry]) => entry.descriptor);
}

export function lookupTool(name: string): ToolEntry | null {
  return TOOL_REGISTRY[name] ?? null;
}
