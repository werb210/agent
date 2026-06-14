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
};

export function descriptorsForAudience(audience: MayaAudience): ToolDescriptor[] {
  return Object.entries(TOOL_REGISTRY)
    .filter(([name]) => isToolAllowed(audience, name))
    .map(([, entry]) => entry.descriptor);
}

export function lookupTool(name: string): ToolEntry | null {
  return TOOL_REGISTRY[name] ?? null;
}
