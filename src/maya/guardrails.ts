// AGENT_GUARDRAILS_v1
// Maya sits on a public marketing site for a regulated activity. A reply that
// tells a visitor they are approved, funded, or guaranteed financing is a
// representation Boreal cannot make and did not authorise. The model is told not
// to in the system prompt; this catches it if the model does it anyway.

const SAFE_REPLY =
  "I cannot tell you whether financing will be approved - that decision sits with a lender after they review your file. What I can tell you is that applying costs nothing, carries no obligation, and does not affect your credit. Would you like me to walk you through what is involved?";

// Assertions of a funding or approval outcome. Deliberately narrow: these match
// claims ABOUT the reader, not neutral descriptions of how underwriting works.
const OUTCOME_PATTERNS: RegExp[] = [
  /\byou(?:'| a)?re\s+(?:already\s+)?(?:approved|pre-?approved|pre-?qualified|guaranteed|funded)\b/i,
  /\byou(?:'ll|\s+(?:will|would|should|can expect to|are going to))\s+(?:be\s+)?(?:approved|funded|pre-?approved|qualify|get (?:the )?(?:funding|financing|money|loan))\b/i,
  /\b(?:guaranteed|assured|certain)\s+(?:approval|funding|financing)\b/i,
  /\bwe\s+(?:guarantee|can guarantee|promise)\b/i,
  /\byou\s+(?:definitely|certainly|absolutely)\s+(?:qualify|will qualify)\b/i,
  /\byou\s+(?:will|'ll)\s+(?:be\s+)?(?:declined|rejected|turned down)\b/i,
  /\byou\s+(?:do\s+not|don'?t)\s+qualify\b/i,
];

// Hedged or negated sentences are the CORRECT behaviour and must not be caught.
// "I cannot say whether you would be approved" contains an outcome phrase but
// asserts nothing.
const HEDGE = /\b(?:whether|cannot|can'?t|unable to|only the lender|the lender decides|up to the lender|no one can)\b/i;

export function assertsFundingOutcome(reply: string): boolean {
  if (typeof reply !== "string" || !reply) return false;
  return reply
    .split(/(?<=[.!?])\s+/)
    .some((sentence) => !HEDGE.test(sentence) && OUTCOME_PATTERNS.some((re) => re.test(sentence)));
}

export function applyGuardrails(reply: string): string {
  return assertsFundingOutcome(reply) ? SAFE_REPLY : reply;
}

export const GUARDRAIL_SAFE_REPLY = SAFE_REPLY;

// MAYA_v817 - numbers listed in MAYA_PRIVATE_NUMBERS (comma-separated; e.g. a staff member's private cell) must
// never appear in anything Maya says, whatever the model, the trained knowledge or another env var contains. Any
// spelling of one becomes Boreal's toll-free line. The numbers live only in the setting, never in code.
function privateNumberPatterns(env: NodeJS.ProcessEnv = process.env): RegExp[] {
  return String(env.MAYA_PRIVATE_NUMBERS ?? "")
    .split(",")
    .map((n) => n.replace(/\D/g, "").slice(-10))
    .filter((d) => d.length === 10)
    .map((d) => new RegExp(`(?:\\+?\\s*1[\\s.-]*)?\\(?\\s*${d.slice(0, 3)}\\s*\\)?[\\s.-]*${d.slice(3, 6)}[\\s.-]*${d.slice(6)}\\b`, "g"));
}
export const PUBLIC_TOLL_FREE = "1-866-631-8939";
export function scrubPrivateNumbers(text: string): string {
  if (typeof text !== "string" || !text) return text;
  return privateNumberPatterns().reduce((t, re) => t.replace(re, PUBLIC_TOLL_FREE), text);
}
