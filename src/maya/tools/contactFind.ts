// MAYA_STAFF_CONTACT_FIND — find a CRM contact by name/email/phone/company.
import { callBFServer } from "../../integrations/bfServerClient.js";

export type ContactFindArgs = { query: string; silo?: string; session_id?: string };
export type ContactFindResult = {
  ok: boolean;
  count?: number;
  contacts?: ReadonlyArray<Record<string, unknown>>;
  error?: string;
};

function s(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t.length ? t : null;
}

export async function contactFind(args: ContactFindArgs): Promise<ContactFindResult> {
  const query = s(args?.query);
  if (!query) return { ok: false, error: "query_required" };
  try {
    const r = await callBFServer<ContactFindResult>("/api/maya/staff/contact-find", {
      method: "POST",
      body: { query, silo: s(args?.silo) ?? undefined, session_id: s(args?.session_id) ?? undefined },
    });
    if (!r || typeof r !== "object") return { ok: false, error: "empty_response" };
    return r;
  } catch {
    return { ok: false, error: "contact_find_failed" };
  }
}

export const CONTACT_FIND_TOOL_DESCRIPTOR = {
  type: "function" as const,
  function: {
    name: "contact.find",
    description:
      "Find a CRM contact by name, email, phone, or company. Use this to resolve who a staff member is referring to before summarizing a deal or drafting an email. Returns up to 10 matches with id, name, email, phone, company, lead status, and silo.",
    parameters: {
      type: "object",
      properties: {
        query: { type: "string", description: "Name, email, phone, or company to search for." },
        silo: { type: "string", description: "Optional silo filter: BF, BI, or SLF." },
        session_id: { type: "string", description: "Optional session id for audit/correlation." },
      },
      required: ["query"],
    },
  },
};
