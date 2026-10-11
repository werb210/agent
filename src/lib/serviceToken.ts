// AGENT_v784_SERVICE_TOKEN - the one service token the agent presents to BF-Server.
// Every signer in the agent uses this so BF-Server sees a single, recognizable shape.
// AGENT_v789_SERVICE_TOKEN - signed with AGENT_SERVICE_JWT_SECRET when it is set (so the
// agent's credential can be rotated apart from the user-session secret), else JWT_SECRET,
// and scoped with iss "agent" / aud "bf-server".
import jwt from "jsonwebtoken";

export const SERVICE_TOKEN_CLAIMS = {
  kind: "service",
  service: "agent",
  source: "agent",
  principal: "service",
  id: "agent-service",
  role: "Staff",
} as const;

export const SERVICE_TOKEN_ISSUER = "agent";
export const SERVICE_TOKEN_AUDIENCE = "bf-server";

/** The secret outbound service tokens are signed with. */
export function serviceTokenSecret(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const dedicated = env.AGENT_SERVICE_JWT_SECRET?.trim();
  if (dedicated) return dedicated;
  const shared = env.JWT_SECRET?.trim();
  return shared || undefined;
}

export function signServiceToken(secret: string | undefined = serviceTokenSecret()): string {
  if (!secret) throw new Error("AGENT_SERVICE_JWT_SECRET or JWT_SECRET not configured");
  return jwt.sign({ ...SERVICE_TOKEN_CLAIMS }, secret, {
    algorithm: "HS256",
    expiresIn: "1h",
    issuer: SERVICE_TOKEN_ISSUER,
    audience: SERVICE_TOKEN_AUDIENCE,
  });
}

/**
 * True when the bearer token is a valid service token minted BY BF-Server for the agent.
 * A token the agent itself minted for BF-Server (aud "bf-server") is refused, so one the
 * agent sent out cannot be replayed back at it.
 */
export function isValidServiceToken(token: string | undefined | null, secret: string | undefined = process.env.JWT_SECRET): boolean {
  if (!token || !secret) return false;
  try {
    const p = jwt.verify(token, secret, { algorithms: ["HS256"] }) as Record<string, unknown>;
    if (!p || typeof p !== "object" || p.kind !== "service") return false;
    const aud = Array.isArray(p.aud) ? p.aud : [p.aud];
    return !aud.includes(SERVICE_TOKEN_AUDIENCE);
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
