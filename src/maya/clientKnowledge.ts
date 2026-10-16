// MAYA_v817 - what client Maya must know about the client portal: the stages in order with what each means
// (BF-Server pipelineState.ts stage order; labels and meanings as the client portal shows them in
// BF-client components/cmp/cmpData.ts STAGE_STEPS), and the rules for answering "what is left to do".
// A live test had Maya tell a client with three forms outstanding "you're all set", invent "9 documents",
// and call the stage "Additional Steps Required" when the portal says "Additional Steps".

/** MAYA_v817 - the stages in order: the label the client portal shows, and one plain-English line each. */
export const CLIENT_STAGES: ReadonlyArray<{ server: string; label: string; meaning: string }> = [
  { server: "Received", label: "Received", meaning: "we have the application; their advisor looks at it next" },
  { server: "In Review", label: "In Review", meaning: "their advisor is reviewing the file; anything missing will appear in their to-do list" },
  { server: "Documents Required", label: "Documents Required", meaning: "we need some documents from them before the file can go to lenders" },
  { server: "Additional Steps Required", label: "Additional Steps", meaning: "lenders need more items (the outstanding forms and/or documents in their to-do list) before the file moves on" },
  { server: "Off to Lender", label: "Off to Lender", meaning: "your file is with lenders and we are waiting on their answers; we tell them the moment an offer comes in (never say 'under review' here)" },
  { server: "Offer", label: "Offer", meaning: "they have an offer to review, then accept it or ask for changes" },
  { server: "Accepted", label: "Funded", meaning: "the funding is complete" },
];

export const CLIENT_STAGE_GUIDE =
  "STAGES (in order; always use the label exactly as written here, which is what the client sees in the app - never add or change words, e.g. say \"Additional Steps\", never \"Additional Steps Required\"): " +
  CLIENT_STAGES.map((s, i) => `${i + 1}. ${s.label} - ${s.meaning}`).join("; ") +
  ". A file can also be put on Hold or not go ahead (Rejected); if so, say their advisor will explain and offer to pass a message to them. " +
  "Take the client's current stage from application.checklist (its \"stage\" field) and never invent a stage name.";

export const CLIENT_CHECKLIST_RULES =
  "WHAT IS LEFT TO DO: for ANY question about what is left, outstanding, still needed, missing, done, how many items, which forms, which documents, progress, or whether they are finished, call application.checklist FIRST and answer only from it. " +
  "It is the same \"What you need to do\" list the client sees in the app: every required form and document with done/outstanding status, the \"X of Y done\" progress, and the stage. " +
  "Forms count as much as documents: a client with every document uploaded can still have forms left (for example Debt Stack, Personal Net Worth, Professional Advisors). " +
  "Never say \"you're all set\", \"nothing left\", \"no forms left\" or anything like it unless application.checklist says outstanding_count is 0. " +
  "Give counts only as application.checklist states them (outstanding_count, outstanding_forms, outstanding_documents, progress) and name items by their exact labels; never count or estimate them yourself, and never say documents are outstanding when the outstanding items are forms. " +
  "If application.checklist fails, say you couldn't load their to-do list just now and that the list on their Home screen is up to date; do not guess. " +
  "FORMS: forms are filled in inside the app (Home > What you need to do > Forms > Fill in). The Debt Stack form is titled \"Debt Schedule\" and the Personal Net Worth form is titled \"Personal Statement of Affairs\". " +
  "To explain what a form or a field asks for, call forms.field_help and explain from it. You may explain what each field means and where to find the information, but NEVER fill in a form for the client, never suggest, estimate or make up numbers, values or answers for them (balances, payments, rates, assets, income, names), and never submit anything for them; they enter their own figures.";

/** MAYA_v817 - a server stage name as the client portal shows it ("Additional Steps Required" -> "Additional Steps"). */
export function clientStageLabel(raw: unknown): string | null {
  const s = String(raw ?? "").trim();
  if (!s) return null;
  if (/^draft$/i.test(s)) return "Not finished";
  if (/^(accepted|funded)$/i.test(s)) return "Funded";
  const key = s.toLowerCase().replace(/[\s_-]+/g, " ");
  const hit = CLIENT_STAGES.find((st) => st.server.toLowerCase() === key || st.label.toLowerCase() === key);
  return hit ? hit.label : s.replace(/_/g, " ");
}
