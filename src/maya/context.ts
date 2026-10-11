// AGENT_v784_MAYA_CONTEXT - Maya's caller identity comes ONLY from a signed
// X-Maya-Context header (HS256, JWT_SECRET, kind "maya_context") minted by
// BF-Server. The X-Maya-Audience header and body.phone / body.staff are never
// trusted: without a valid context the caller is public, with no phone and no staff.
import jwt from "jsonwebtoken";
import type { Request } from "express";
import type { MayaAudience } from "./audience.js";

export const MAYA_CONTEXT_HEADER = "x-maya-context";

export type MayaStaff = { id: string | null; name: string | null; email: string | null; role: string | null; phone: string | null };

export type MayaContext = {
  verified: boolean;
  audience: MayaAudience;
  phone: string | null;
  staff: MayaStaff | null;
  silo: string | null;
  /** AGENT_v789_SESSION_KEY - who the token was minted for: staff id/email, client phone, or the visitor's sub/session claim. */
  subject: string | null;
  /** AGENT_v789_HANDOFF_IDENTITY - the client's CRM contact id, when BF-Server put one in the token. */
  contactId: string | null;
};

export const PUBLIC_CONTEXT: MayaContext = Object.freeze({ verified: false, audience: "visitor", phone: null, staff: null, silo: null, subject: null, contactId: null });

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim() : null);

export function verifyMayaContext(token: string | undefined | null, secret: string | undefined = process.env.JWT_SECRET): MayaContext {
  if (!token || !secret) return PUBLIC_CONTEXT;
  let p: Record<string, unknown>;
  try {
    p = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Record<string, unknown>;
  } catch {
    return PUBLIC_CONTEXT;
  }
  if (!p || typeof p !== "object" || p.kind !== "maya_context") return PUBLIC_CONTEXT;
  const aud = str(p.audience)?.toLowerCase();
  if (aud === "staff") {
    const s = p.staff && typeof p.staff === "object" ? (p.staff as Record<string, unknown>) : null;
    if (!s) return PUBLIC_CONTEXT;
    const staff = { id: str(s.id), name: str(s.name), email: str(s.email), role: str(s.role), phone: str(s.phone) };
    return {
      verified: true,
      audience: "staff",
      phone: null,
      staff,
      silo: str(p.silo),
      subject: staff.id ?? staff.email?.toLowerCase() ?? null,
      contactId: null,
    };
  }
  if (aud === "client") {
    const phone = str(p.phone);
    return { verified: true, audience: "client", phone, staff: null, silo: str(p.silo), subject: phone, contactId: str(p.contact_id) };
  }
  return { ...PUBLIC_CONTEXT, verified: true, subject: str(p.sub) ?? str(p.session_id) };
}

export function mayaContextFromRequest(req: Request): MayaContext {
  return verifyMayaContext(req.header(MAYA_CONTEXT_HEADER));
}
