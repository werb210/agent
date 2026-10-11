// AGENT_v789_MAYA_CONTEXT_REQUIRED - tests call /api/maya/* the way BF-Server does: with a
// signed X-Maya-Context. visitorContext() is what BF-Server sends for a website visitor.
import jwt from "jsonwebtoken";

export function mayaContext(claims: Record<string, unknown> = { audience: "visitor" }, secret: string = process.env.JWT_SECRET || "test-secret"): string {
  return jwt.sign({ kind: "maya_context", ...claims }, secret, { algorithm: "HS256", expiresIn: "5m" });
}

export const visitorContext = (sub = "visitor-1", secret?: string) => mayaContext({ audience: "visitor", sub }, secret);
