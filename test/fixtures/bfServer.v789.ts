// AGENT_v789_CONTRACT_FIXTURES - BF-Server response bodies for every path the live agent
// calls, as BF-Server v789 returns them (JSON body, before callBFServer unwraps a
// {status:"ok", data} envelope). The fetch fake in test/bfServerFake.ts answers ONLY these
// paths; any other path fails the test, so a tool cannot quietly call a route that does
// not exist on BF-Server. Paths are under /api/ with no /v1/. Lender products use
// interestMin / interestMax.

export const APP_ID = "4b0f2c3e-61ae-4d7e-9a51-0c2d7f61ae00";
export const CONTACT_ID = "c6a1d9f2-2b7e-4f63-8d0a-5e1b9c0d4a11";

export const APPLICATION_SUMMARY = {
  ok: true,
  application_id: APP_ID,
  shortId: "61AE",
  name: "Northwind Trucking Ltd.",
  pipeline_state: "Offer",
  current_stage: "Offer",
  status: "active",
  requested_amount: 250000,
  product_category: "TERM",
  currency: "CAD",
  days_in_stage: 3,
  applicant: { name: "Dana Lee", email: "dana@northwind.example", phone: "+17805550111", company: "Northwind Trucking Ltd." },
  documents: [
    { document_category: "bank_statements", status: "accepted" },
    { document_category: "financial_statements", status: "received" },
    { document_category: "void_cheque", status: "missing" },
  ],
  bi_completion_url: null,
  bi_public_id: null,
  // v789: offers, signature_status and continuation_url on application-summary.
  offers: [
    { id: "off_1", product_category: "TERM", amount: 200000, rate: "11.5%", rate_type: "APR", term_months: 36, status: "pending", expires_at: "2026-10-25T00:00:00.000Z" },
    { id: "off_2", product_category: "MCA", amount: 120000, rate: "1.32", rate_type: "factor", term_months: 12, status: "pending", expires_at: "2026-10-20T00:00:00.000Z" },
  ],
  signature_status: "pending",
  continuation_url: "https://client.boreal.financial/applications/61AE/continue",
  last_activity_at: "2026-10-09T17:20:00.000Z",
  next_action: "Collect the void cheque.",
};

export const APPLICATIONS_BY_PHONE = {
  ok: true,
  contactName: "Dana Lee",
  contact: { id: CONTACT_ID, name: "Dana Lee", firstName: "Dana", companyName: "Northwind Trucking Ltd.", email: "dana@northwind.example", dob: "1984-03-02" },
  applications: [
    { id: APP_ID, shortId: "61AE", name: "Northwind Trucking Ltd.", productCategory: "TERM", requestedAmount: 250000, stage: "Offer", startedAt: "2026-09-30T15:00:00.000Z", submittedAt: "2026-10-01T15:00:00.000Z", documents: [], signed: false },
  ],
  offers: [{ amount: 200000, term: "36 months", rate: "11.5%", status: "pending", expires: "2026-10-25" }],
  latestDocs: [],
};

// MAYA_v817 - the live-test file: every document done, three forms left, stage "Additional Steps".
export const CLIENT_CHECKLIST = {
  ok: true,
  stage: "Additional Steps",
  stage_raw: "Additional Steps Required",
  progress: "11 of 14 done",
  done_count: 11,
  total_count: 14,
  outstanding_count: 3,
  outstanding_documents: 0,
  outstanding_forms: 3,
  outstanding: [
    { label: "Debt Stack", type: "form", status: "outstanding" },
    { label: "Personal Net Worth", type: "form", status: "outstanding" },
    { label: "Professional Advisors", type: "form", status: "outstanding" },
  ],
  completed: [{ label: "Bank Statements", type: "document", status: "done" }],
  what_happens_next: "Lenders need a few more items before your file moves on: 3 forms.",
  summary: "Stage \"Additional Steps\". 11 of 14 done; 3 outstanding (3 forms): Debt Stack, Personal Net Worth, Professional Advisors.",
};

export const BF_SERVER_FIXTURES: Record<string, unknown> = {
  "/api/telephony/presence": { status: "ok", data: [{ user_id: "u_1", status: "available", twilio_identity: "staff_u_1" }] },
  "/api/communications/maya-handoff": { status: "ok", fanout: { attempted: ["+17805550100", "+17805550101"], delivered: ["+17805550100"] } },
  "/api/maya/escalate": { ok: true, conversation_id: "conv_1", persisted: true },
  "/api/crm/startup-waitlist": { ok: true, id: "wl_1" },
  "/api/maya/knowledge-search": { ok: true, context: "" },
  "/api/maya/maya-persona": { ok: true, persona: "", tone: "" },
  "/api/maya/catalog-summary": { ok: true, lenders: 84, products: 197, by_category: { TERM: 41, LOC: 33, EQUIPMENT: 28 } },
  "/api/maya/staff/application-summary": APPLICATION_SUMMARY,
  // MAYA_v817 - BF-Server routes/mayaClientChecklist.ts: the client portal's "What you need to do" list.
  "/api/maya/client-checklist": CLIENT_CHECKLIST,
  "/api/maya/staff/applications-by-phone": APPLICATIONS_BY_PHONE,
  "/api/maya/staff/application-newest": { ok: true, application: { id: APP_ID, name: "Northwind Trucking Ltd." } },
  "/api/maya/staff/audit-recent": { ok: true, entries: [{ tool: "pipeline.facts", ok: true, at: "2026-10-11T15:00:00.000Z", summary: "12 live deals" }] },
  "/api/maya/staff/automations-overview": { ok: true, automations: [{ name: "New lead welcome", active: true, enrolled: 14 }] },
  "/api/maya/staff/banking-summary": { ok: true, application_id: APP_ID, avg_monthly_deposits: 84000, avg_daily_balance: 21000, nsf_count: 0, months_profitable: 5, period: { from: "2026-04-01", to: "2026-09-30" } },
  "/api/maya/staff/call-initiate": { ok: true, to: "+17805550111", contact_id: CONTACT_ID },
  "/api/maya/staff/call-triage": { ok: true, voicemails: [], missed_calls: [{ from: "+17805550199", at: "2026-10-11T14:00:00.000Z" }] },
  "/api/maya/staff/comms-overview": { ok: true, waiting_on_reply: 2, missed_calls: 1, voicemails: 0, team_unread: 3 },
  "/api/maya/staff/contact-find": { ok: true, matches: [{ id: CONTACT_ID, name: "Dana Lee", email: "dana@northwind.example", phone: "+17805550111", company: "Northwind Trucking Ltd.", lead_status: "client", silo: "BF" }] },
  "/api/maya/staff/contact-picture": { ok: true, contact: { id: CONTACT_ID, name: "Dana Lee" }, applications: [{ id: APP_ID, stage: "Offer" }] },
  "/api/maya/staff/contact-timeline": { ok: true, items: [{ kind: "sms", at: "2026-10-10T16:00:00.000Z", summary: "Sent void cheque request" }] },
  "/api/maya/staff/credit-summary": { ok: true, status: "draft", version: 2, sections: { Overview: "Trucking operator, 6 years.", Rationale: "Stable deposits." } },
  "/api/maya/staff/crm-add-note": { ok: true, note: { id: "n_2", body: "Called, left voicemail." } },
  "/api/maya/staff/crm-create-task": { ok: true, task: { id: "t_2", title: "Follow up on void cheque", due_at: "2026-10-13" } },
  "/api/maya/staff/crm-notes": { ok: true, notes: [{ id: "n_1", body: "Prefers text.", created_at: "2026-10-01T15:00:00.000Z" }] },
  "/api/maya/staff/crm-tasks": { ok: true, tasks: [{ id: "t_1", title: "Request void cheque", due_at: "2026-10-12", status: "open" }] },
  "/api/maya/staff/daily-briefing": { ok: true, waiting_on_documents: 4, stale_deals: 2, voicemails: 1 },
  "/api/maya/staff/docs-request-draft": { ok: true, missing: ["void_cheque"], draft: "Hi Dana, could you upload a void cheque?" },
  "/api/maya/staff/draft-email": { ok: true, draft: { to: "dana@northwind.example", subject: "Next steps", body: "Hi Dana" } },
  "/api/maya/staff/lender-match-explain": { ok: true, matches: [{ product: "Term loan", match_pct: 82, reasons: ["amount in range"] }], missing_inputs: [], stale: false },
  "/api/maya/staff/lender-products": {
    ok: true,
    ranges: [{ category: "TERM", rate_kind: "APR", amountMin: 10000, amountMax: 5000000, interestMin: 7.5, interestMax: 24.9, count: 41 }],
    products: [{ category: "TERM", country: "CA", amountMin: 25000, amountMax: 500000, interestMin: 8.9, interestMax: 18.5 }],
  },
  "/api/maya/staff/marketing-overview": { ok: true, email_opt_in: 1840, sms_opt_in: 920, segments: [{ tag: "past-clients", recipients: 412 }], recent_jobs: [] },
  "/api/maya/staff/marketing-send": { ok: true, preview: true, channel: "email", tag: "past-clients", recipients: 412, pending_action_id: "pa_7f3c" },
  "/api/maya/staff/notes-read": { ok: true, notes: [{ id: "n_1", body: "Prefers text." }] },
  "/api/maya/staff/pgi-readiness": { ok: true, ready: false, missing: ["ar_aging"], submitted: false },
  "/api/maya/staff/pipeline-facts": { ok: true, live: 12, by_stage: { "Received and In Review": 4, "Off to Lender": 3, Offer: 2 }, funded_30d: 3 },
  "/api/maya/staff/pipeline-query": { ok: true, answer: "4 applications are in Received and In Review.", rows: [] },
  "/api/maya/staff/referrers-overview": { ok: true, referrers: [{ name: "Prairie Accounting", referrals: 3 }] },
  "/api/maya/staff/risk-flags": { ok: true, flags: [{ kind: "missing_docs", detail: "void_cheque" }] },
  "/api/maya/staff/send-sms": { pending: true, pendingId: "sms_1", preview: { to: "+17805550111", body: "Hi Dana" } },
  "/api/maya/staff/todo-status": { ok: true, application_id: APP_ID, todo: ["Upload void cheque", "Sign the application"] },
  "/api/maya/staff/underwriting-summary": { ok: true, completeness: 0.67, blockers: ["void_cheque missing"], strengths: ["6 years in business"] },
  "/api/maya/staff/ads-performance": { ok: true, days: 30, spend: 4210.55, clicks: 812, conversions: 9, campaigns: [{ name: "Search - Business Loans", spend: 3100.2 }] },
  "/api/maya/staff/ads-keywords": { ok: true, keywords: [{ text: "business loan canada", spend: 820.1, clicks: 140, conversions: 3 }], campaigns: [{ id: "111", name: "Search - Business Loans" }] },
  "/api/maya/staff/ads-negatives": { ok: true, negatives: [{ id: "neg_1", term: "free money", match_type: "EXACT", campaign: "Search - Business Loans" }], conflicts: [] },
  "/api/maya/staff/ads-negatives/add": { ok: true, preview: true, campaign: { id: "111", name: "Search - Business Loans" }, will_add: [{ term: "student loan", match_type: "EXACT" }], refused: [{ term: "business loan", reason: "one of our own keywords" }], confirm_token: "ct_add_91a2" },
  "/api/maya/staff/ads-negatives/remove": { ok: true, preview: true, negative: { id: "neg_1", term: "free money", match_type: "EXACT", campaign: { id: "111", name: "Search - Business Loans" } }, confirm_token: "ct_rm_44b0" },
  "/api/maya/staff/ads-story": { ok: true, by: "campaign", rows: [{ name: "Search - Business Loans", spend: 3100.2, applications: 5, funded: 1, roas: 2.4 }], ad_rules: [] },
  "/api/maya/staff/ads-visitors": { ok: true, visitors: [{ landing: "/", from_ad: true, started: true }], ad_rules: [] },
  "/api/maya/staff/ads-dropoff": { ok: true, started: 40, submitted: 22, steps: [{ step: 3, stopped: 9 }], ad_rules: [] },
  "/api/maya/staff/ads-health": { ok: true, signed_in: true, conversion_uploads: "ok", ga4: "ok", ad_rules: [] },
  "/api/maya/staff/ga4": { ok: true, sessions: 5120, users: 3900, sources: [{ source: "google", sessions: 2600 }], ad_rules: [] },
  "/api/maya/staff/ads-audiences": { ok: true, lists: [{ name: "Applicants", size: 610 }, { name: "Funded clients", size: 88 }], unsent_applicants: 12, ad_rules: [] },
};

/** Every BF-Server path the agent may call. The fetch fake refuses anything else. */
export const REAL_BF_SERVER_PATHS: ReadonlyArray<string> = Object.keys(BF_SERVER_FIXTURES);
