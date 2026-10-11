// AGENT_v784_SERVICE_TOKEN - the one service token the agent presents to BF-Server.
// Every signer in the agent uses this so BF-Server sees a single, recognizable shape.
import jwt from "jsonwebtoken";

export const SERVICE_TOKEN_CLAIMS = {
  kind: "service",
  service: "agent",
  source: "agent",
  principal: "service",
  id: "agent-service",
  role: "Staff",
} as const;

export function signServiceToken(secret: string | undefined = process.env.JWT_SECRET): string {
  if (!secret) throw new Error("JWT_SECRET not configured");
  return jwt.sign({ ...SERVICE_TOKEN_CLAIMS }, secret, { algorithm: "HS256", expiresIn: "1h" });
}

/** True when the bearer token is a valid agent/BF-Server service token. */
export function isValidServiceToken(token: string | undefined | null, secret: string | undefined = process.env.JWT_SECRET): boolean {
  if (!token || !secret) return false;
  try {
    const p = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Record<string, unknown>;
    return Boolean(p && typeof p === "object" && p.kind === "service");
  } catch {
    return false;
  }
}

/** Log auth refusals from BF-Server instead of swallowing them. */
export function logBFServerAuthFailure(path: string, status: number): void {
  if (status === 401 || status === 403) {
    console.error(JSON.stringify({ msg: "bf_server_auth_refused", path, status }));
  }
}
