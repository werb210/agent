// MAYA_v817 - client-audience, READ-ONLY tools for the client portal's to-do list.
//   application.checklist - the client's own "What you need to do" list exactly as the portal shows it
//     (every required form and document with done/outstanding, "X of Y done", the stage label), from
//     BF-Server POST /api/maya/client-checklist. The application id and the verified phone are injected
//     by dispatch (CLIENT_APP_TOOLS); BF-Server refuses an application the phone does not own.
//   forms.field_help - what each field of the Debt Schedule (Debt Stack), Personal Statement of Affairs
//     (Personal Net Worth) and Professional Advisors forms asks for, from the real form labels in BF-client
//     (pages/mini-portal/forms/forms/*.tsx). Maya explains; she never fills a form in.
import { callBFServer } from "../../integrations/bfServerClient.js";

const s = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export type ChecklistArgs = { application_id?: string; phone?: string; session_id?: string };

/** MAYA_v817 - the newest application of the verified phone, when the request carried no application id. */
async function resolveOwnApplication(phone: string, sessionId: string | null): Promise<string | null> {
  try {
    const r = await callBFServer<{ applications?: Array<{ id?: unknown }> }>("/api/maya/staff/applications-by-phone", { method: "POST", body: { phone, session_id: sessionId } });
    const id = Array.isArray(r?.applications) ? r.applications[0]?.id : null;
    return typeof id === "string" && id ? id : null;
  } catch {
    return null;
  }
}

export async function applicationChecklist(args: ChecklistArgs) {
  const phone = s(args?.phone);
  if (!phone) return { ok: false, error: "verified_phone_required", summary: "I couldn't confirm who you are, so I can't open your to-do list." };
  const sessionId = s(args?.session_id);
  const applicationId = s(args?.application_id) ?? (await resolveOwnApplication(phone, sessionId));
  if (!applicationId) return { ok: false, error: "application_not_found", summary: "I couldn't find an application for you." };
  try {
    const r = await callBFServer<Record<string, unknown>>("/api/maya/client-checklist", {
      method: "POST",
      body: { application_id: applicationId, phone, session_id: sessionId },
    });
    if (!r || typeof r !== "object" || r.ok === false) return { ok: false, error: "checklist_unavailable", summary: "I couldn't load your to-do list just now." };
    return {
      ...r,
      ok: true,
      application_id: applicationId,
      how_to_answer: "This is exactly the client's \"What you need to do\" list in the app. Quote the stage, the progress and the item labels as given; never add up, estimate or rename them. outstanding_count 0 is the only case where nothing is left.",
    };
  } catch {
    return { ok: false, error: "checklist_unavailable", summary: "I couldn't load your to-do list just now." };
  }
}

export const APPLICATION_CHECKLIST_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "application.checklist",
    description:
      "The signed-in client's own to-do list exactly as the client app shows it under \"What you need to do\": every required FORM and DOCUMENT with done/outstanding status, the \"X of Y done\" progress, the outstanding counts, the stage label as the app shows it, and what happens next. Use it FIRST for 'is there anything left to do', 'how many are outstanding', 'which forms do I need', 'am I done', 'what stage am I at'.",
    parameters: { type: "object", properties: {}, required: [] }, // the application and phone come from the verified session
  },
};

type Field = { label: string; help: string };
type Section = { name: string; fields: Field[] };
type FormHelp = { form: string; title: string; also_called: string[]; intro: string; sections: Section[]; notes: string[] };

// MAYA_v817 - field labels copied from BF-client DebtStackForm.tsx, PersonalNetWorthForm.tsx and AdvisorsForm.tsx.
export const CLIENT_FORMS: ReadonlyArray<FormHelp> = [
  {
    form: "debt_stack",
    title: "Debt Schedule",
    also_called: ["Debt Stack", "debt schedule", "existing debts"],
    intro: "A list of the business's existing debts and obligations (term loans, lines of credit, leases, etc.). One card per debt; \"+ Add debt\" adds another, \"Remove\" deletes one.",
    sections: [
      { name: "Top of the form", fields: [{ label: "Business / client name", help: "The business's name; it is filled in from the application and can be corrected." }] },
      {
        name: "Each debt (Debt 1, Debt 2, ...)",
        fields: [
          { label: "Lender / creditor", help: "Who the business owes: the bank, lender or leasing company." },
          { label: "Facility type", help: "The kind of debt, e.g. term loan, line of credit, equipment lease, vehicle loan, credit card." },
          { label: "Original amount", help: "The amount first borrowed or the original credit limit, from the loan agreement." },
          { label: "Current balance", help: "What is still owed today, from the latest statement or online banking." },
          { label: "Monthly payment", help: "The regular payment, converted to a monthly figure if paid weekly or bi-weekly." },
          { label: "Rate %", help: "The interest rate on the debt, as shown on the agreement or statement." },
          { label: "Maturity", help: "When the debt ends or comes up for renewal." },
          { label: "Secured by", help: "What the debt is secured against, e.g. equipment, real estate, a general security agreement, or nothing (unsecured)." },
        ],
      },
      { name: "Bottom of the form", fields: [{ label: "Notes", help: "Anything the lender should know about these debts." }] },
    ],
    notes: ["Total balance and Total monthly payments are added up automatically.", "Press Submit when done; the form saves as you go."],
  },
  {
    form: "net_worth_statement",
    title: "Personal Statement of Affairs",
    also_called: ["Personal Net Worth", "PNW", "personal net worth statement", "statement of affairs"],
    intro: "A personal net worth declaration for the owner. Tick \"Joint declaration (Primary Party and Spouse / Common-law partner)\" to add a spouse or common-law partner.",
    sections: [
      {
        name: "Primary Party",
        fields: [
          { label: "Full legal name", help: "Your name as on your government ID." },
          { label: "SIN (Canada) or SSN (US)", help: "Your Social Insurance Number (Canada) or Social Security Number (US)." },
          { label: "Alternate name(s)", help: "Any other name you go by." },
          { label: "Prior name(s)", help: "Any earlier legal name, e.g. a maiden name." },
          { label: "Date of birth", help: "Your date of birth." },
          { label: "Marital status", help: "Pick one: Single, Married, Common-law, Separated, Divorced or Widowed." },
          { label: "Number of dependents", help: "How many people depend on you financially." },
          { label: "Home #, Cell phone, Work #", help: "Your phone numbers." },
          { label: "Personal email, Work email", help: "Your email addresses." },
          { label: "Full home address", help: "Where you live." },
          { label: "Physical address (if different)", help: "Only if it differs from your home address." },
        ],
      },
      { name: "Personal References (1 to 3; \"+ Add reference\")", fields: [{ label: "Reference name, Relationship, Cell phone, Address", help: "People who know you (not your spouse) and how they know you." }] },
      { name: "Spouse / Common-law Partner (joint only)", fields: [{ label: "SIN or SSN, Alternate and Prior name(s), Date of birth, Employer phone #, Home #, Cell phone, Work #, Personal email, Work email", help: "The same details for your spouse or common-law partner." }] },
      {
        name: "Sources of Income (annual)",
        fields: [{ label: "Employment, Dividend, Rental, Investment, Other income", help: "Yearly personal income by type; a Spouse column appears for a joint declaration." }],
      },
      {
        name: "Spouse / Other Family Income (Monthly)",
        fields: [{ label: "Spouse legal name, Spouse monthly income, Spouse employer, How long at employer, Other family income (source), Other family monthly income", help: "Household income from your spouse or other family members, as monthly amounts." }],
      },
      {
        name: "Disclosures (Yes / No)",
        fields: [
          { label: "Previous dealings with Boreal Financial (any division or subsidiary)?", help: "Yes if you have dealt with Boreal before." },
          { label: "Ever filed for bankruptcy, consumer proposal, or any form of insolvency?", help: "Answer for yourself (and your spouse on a joint declaration)." },
          { label: "Ever convicted of a criminal offence not pardoned?", help: "Answer truthfully." },
          { label: "Income taxes for previous year(s) fully satisfied?", help: "Yes if all past personal income taxes are paid." },
          { label: "Any legal actions, pending/looming actions or judgments against you?", help: "Lawsuits or judgments against you personally." },
          { label: "Are you a co-signor, guarantor or obligor to any other party's debts?", help: "Yes if you guaranteed or co-signed someone else's debt." },
          { label: "Additional disclosure / details", help: "Explain any Yes answer here." },
        ],
      },
      {
        name: "Assets",
        fields: [{ label: "Cash; RRSP / 401(k); TFSA / IRA; Stocks / Bonds; Accounts Receivable; Other (liquid); Vehicle 1-3; Real estate 1-3; Shareholder loans; Other (non-tangible); Other asset 1-3", help: "What each asset is worth today. Leave blank what you don't have." }],
      },
      {
        name: "Liabilities",
        fields: [{ label: "Credit cards (total); RRSP / 401(k) loans (total); Other loans (total); Stock margin debt; Line of credit (total); Taxes owing (CRA or IRS); Loan on vehicle 1-3; Mortgage on real estate 1-3; Debt for non-tangible assets; Lien on other asset 1-3", help: "What you owe on each, today. Match each loan or mortgage to the asset it is on." }],
      },
    ],
    notes: ["Total assets, Total liabilities and Net worth are calculated automatically.", "After Submit you may be asked to sign the statement in the app."],
  },
  {
    form: "professional_advisors",
    title: "Professional Advisors",
    also_called: ["advisors", "accountant, lawyer and insurance agent"],
    intro: "Your accountant, lawyer and insurance agent, so Boreal Financial can coordinate with them. If you don't have one, you can still submit.",
    sections: [
      {
        name: "Advisors (CPA / Accounting Firm, Attorney / Law Firm, Insurance Agent; \"+ A/R Credit Insurance\" adds a fourth)",
        fields: [
          { label: "Firm", help: "The firm's name." },
          { label: "Contact", help: "The person you deal with there." },
          { label: "Phone", help: "Their phone number." },
          { label: "Email", help: "Their email address." },
        ],
      },
      {
        name: "Ongoing Monitoring",
        fields: [
          { label: "Accounting software used", help: "e.g. QuickBooks, Xero, Sage." },
          { label: "Remote view-only access? (accounting)", help: "Yes or No: whether you could give a lender read-only access to your books." },
          { label: "Primary bank", help: "The business's main bank." },
          { label: "Remote view-only access? (bank)", help: "Yes or No: whether you could give a lender read-only access to the bank account." },
          { label: "Balance outstanding (existing facility)", help: "What is owed today on your existing bank or senior lender facility, if any." },
          { label: "Authorized limit (existing facility)", help: "That facility's approved limit." },
          { label: "Do you have CRA My Business (Canada) or an IRS online business account (US) set up?", help: "Yes or No." },
        ],
      },
      {
        name: "Financial Advisor / Consultant",
        fields: [{ label: "I authorize Boreal Financial to discuss this proposed credit facility with any of its lending partners.", help: "Boreal Financial is your financial advisor on this file; this box must be ticked to submit." }],
      },
    ],
    notes: [
      "If CPA, lawyer or insurance agent is left empty, the app reminds you; you can go back or choose \"Submit without them\" and add them later from More > Forms.",
      "Press \"Submit Advisors\" when done.",
    ],
  },
];

const RULE = "Explain only. Never fill in, suggest, estimate or make up any value or answer for the client, and never submit the form for them; they enter their own figures.";

function findForm(q: string): FormHelp | null {
  const t = q.toLowerCase();
  if (/debt/.test(t)) return CLIENT_FORMS[0];
  if (/net.?worth|pnw|statement of affairs|personal statement|asset|liabilit/.test(t)) return CLIENT_FORMS[1];
  if (/advis|accountant|cpa|lawyer|attorney|insurance agent/.test(t)) return CLIENT_FORMS[2];
  return null;
}

export type FormsFieldHelpArgs = { form?: string; field?: string };
export async function formsFieldHelp(args: FormsFieldHelpArgs) {
  const form = findForm(s(args?.form) ?? s(args?.field) ?? "");
  if (!form) {
    return { ok: true, forms: CLIENT_FORMS.map((f) => ({ title: f.title, also_called: f.also_called, intro: f.intro })), rule: RULE, summary: "Tell me which form (Debt Schedule, Personal Statement of Affairs or Professional Advisors) and I'll explain its fields." };
  }
  const field = s(args?.field)?.toLowerCase() ?? "";
  const words = field.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const matches = words.length
    ? form.sections.flatMap((sec) => sec.fields.filter((f) => words.some((w) => f.label.toLowerCase().includes(w))).map((f) => ({ section: sec.name, ...f })))
    : [];
  return {
    ok: true,
    form: form.title,
    also_called: form.also_called,
    where: "In the app: Home > What you need to do > Forms > Fill in.",
    intro: form.intro,
    ...(matches.length ? { matching_fields: matches } : {}),
    sections: form.sections,
    notes: form.notes,
    rule: RULE,
  };
}

export const FORMS_FIELD_HELP_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "forms.field_help",
    description:
      "Explain what a client-portal form and each of its fields asks for: Debt Schedule (Debt Stack), Personal Statement of Affairs (Personal Net Worth) or Professional Advisors. Use when the client asks what a form is, what to enter in a field, or where to find the information. Explains only; never fills in values.",
    parameters: {
      type: "object",
      properties: {
        form: { type: "string", description: "The form: Debt Schedule / Debt Stack, Personal Statement of Affairs / Personal Net Worth, or Professional Advisors." },
        field: { type: "string", description: "Optional: the field the client is asking about, e.g. 'maturity' or 'secured by'." },
      },
      required: [],
    },
  },
};
