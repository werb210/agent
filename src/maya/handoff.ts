// AGENT_v789_HANDOFF_IDENTITY
// Two things a handoff needs that must not come from the model:
//   - the one-handoff-per-session-per-10-minutes limit (so injected text or a looping
//     model cannot page staff over and over), and
//   - the contact details a VISITOR typed (via visitor.identify / lead.capture /
//     waitlist.join). Those are unverified: they ride along as provided_contact for a
//     person to read, and are never used to match an existing contact or application.

export const HANDOFF_WINDOW_MS = 10 * 60 * 1000;

type HandoffRecord = { at: number; ok: boolean | null };
const handoffs = new Map<string, HandoffRecord>();

export type HandoffClaim =
  | { allowed: true }
  | { allowed: false; previousOk: boolean | null; at: number };

/** Claim the session's handoff slot. Release it with finishHandoff(key, false) if the handoff failed. */
export function claimHandoff(key: string, now: number = Date.now()): HandoffClaim {
  if (!key) return { allowed: true };
  const prev = handoffs.get(key);
  if (prev && now - prev.at < HANDOFF_WINDOW_MS) return { allowed: false, previousOk: prev.ok, at: prev.at };
  handoffs.set(key, { at: now, ok: null });
  return { allowed: true };
}

export function finishHandoff(key: string, ok: boolean): void {
  if (!key) return;
  if (!ok) {
    // A failed handoff does not use up the window; the visitor can try again.
    handoffs.delete(key);
    return;
  }
  const rec = handoffs.get(key);
  if (rec) rec.ok = true;
}

export type ProvidedContact = { name: string | null; phone: string | null; email: string | null };
const provided = new Map<string, ProvidedContact & { at: number }>();
const CONTACT_TTL_MS = 2 * 60 * 60 * 1000;

const str = (v: unknown): string | null => (typeof v === "string" && v.trim() ? v.trim().slice(0, 200) : null);

export function rememberProvidedContact(key: string, contact: Partial<ProvidedContact>): void {
  if (!key) return;
  const prev = getProvidedContact(key);
  provided.set(key, {
    name: str(contact.name) ?? prev.name,
    phone: str(contact.phone) ?? prev.phone,
    email: str(contact.email) ?? prev.email,
    at: Date.now(),
  });
}

export function getProvidedContact(key: string): ProvidedContact {
  const hit = key ? provided.get(key) : undefined;
  if (!hit || Date.now() - hit.at > CONTACT_TTL_MS) return { name: null, phone: null, email: null };
  return { name: hit.name, phone: hit.phone, email: hit.email };
}

/** A visitor can be followed up only with a name AND a phone or email. */
export function canFollowUp(c: ProvidedContact): boolean {
  return Boolean(c.name && (c.phone || c.email));
}

const EMAIL_RE = /[^\s@<>()"']+@[^\s@<>()"']+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+?1[\s.-]?)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b/;
// A name must be capitalised ("I'm Dana Lee"), so "I'm looking for a loan" is not a name.
const NAME_RE = /\b(?:[Mm]y name is|[Nn]ame's|[Tt]his is|I am|I'm|It's)\s+([A-Z][a-zA-Z'-]+(?:\s+[A-Z][a-zA-Z'-]+)?)/;

/** Best-effort pick of contact details out of a message, used only when the model is down. */
export function contactFromText(text: string): ProvidedContact {
  const t = typeof text === "string" ? text.slice(0, 4000) : "";
  const email = t.match(EMAIL_RE)?.[0] ?? null;
  const phone = t.match(PHONE_RE)?.[0] ?? null;
  const name = t.match(NAME_RE)?.[1] ?? null;
  return { name, phone, email };
}

export function _clearHandoffState(): void {
  handoffs.clear();
  provided.clear();
}
