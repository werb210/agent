// AGENT_v789_SERVICE_TOKEN [4] - service tokens are signed with AGENT_SERVICE_JWT_SECRET when set,
// else JWT_SECRET, and carry iss "agent" / aud "bf-server". Checked on the requests actually sent.
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";
import { signServiceToken, serviceTokenSecret, isValidServiceToken, SERVICE_TOKEN_CLAIMS } from "../lib/serviceToken.js";
import { callBFServer } from "../integrations/bfServerClient.js";
import { dispatchTool } from "../maya/dispatch.js";
import { createBfServerFake } from "../../test/bfServerFake.js";

const realFetch = globalThis.fetch;
const saved = { jwt: process.env.JWT_SECRET, svc: process.env.AGENT_SERVICE_JWT_SECRET };
beforeEach(() => { process.env.JWT_SECRET = "shared-jwt-secret"; delete process.env.AGENT_SERVICE_JWT_SECRET; });
afterEach(() => {
  globalThis.fetch = realFetch;
  process.env.JWT_SECRET = saved.jwt;
  if (saved.svc === undefined) delete process.env.AGENT_SERVICE_JWT_SECRET; else process.env.AGENT_SERVICE_JWT_SECRET = saved.svc;
});

const bearer = (h: Record<string, string>) => (h.authorization ?? "").replace(/^Bearer /, "");

describe("service token", () => {
  it("is signed with JWT_SECRET when AGENT_SERVICE_JWT_SECRET is unset, with iss agent and aud bf-server", () => {
    const claims = jwt.verify(signServiceToken(), "shared-jwt-secret", { algorithms: ["HS256"], issuer: "agent", audience: "bf-server" }) as Record<string, unknown>;
    expect(claims).toMatchObject({ ...SERVICE_TOKEN_CLAIMS, iss: "agent", aud: "bf-server" });
    expect(Number(claims.exp) - Number(claims.iat)).toBe(3600);
  });

  it("uses AGENT_SERVICE_JWT_SECRET when it is set", () => {
    process.env.AGENT_SERVICE_JWT_SECRET = "dedicated-agent-secret";
    expect(serviceTokenSecret()).toBe("dedicated-agent-secret");
    const token = signServiceToken();
    expect(() => jwt.verify(token, "shared-jwt-secret")).toThrow();
    expect(jwt.verify(token, "dedicated-agent-secret", { issuer: "agent", audience: "bf-server" })).toBeTruthy();
  });

  it("is what every BF-Server call carries, tools included", async () => {
    process.env.AGENT_SERVICE_JWT_SECRET = "dedicated-agent-secret";
    const fake = createBfServerFake();
    globalThis.fetch = fake.fetch;
    await callBFServer("/api/telephony/presence", { method: "GET" });
    await dispatchTool("pipeline.facts", {}, { audience: "staff", silo: "BF", staffRole: "Admin" });
    await dispatchTool("escalate.to_human", { summary: "help" }, { audience: "client", phone: "+17805550111", sessionId: "s" });
    expect(fake.calls.length).toBeGreaterThanOrEqual(4);
    for (const c of fake.calls) {
      const claims = jwt.verify(bearer(c.headers), "dedicated-agent-secret", { issuer: "agent", audience: "bf-server" }) as Record<string, unknown>;
      expect(claims.kind, c.path).toBe("service");
    }
  });

  it("inbound: accepts a BF-Server service token, refuses the agent's own outbound token", () => {
    expect(isValidServiceToken(jwt.sign({ kind: "service", source: "bf-server" }, "shared-jwt-secret"))).toBe(true);
    expect(isValidServiceToken(signServiceToken())).toBe(false);
    expect(isValidServiceToken(jwt.sign({ kind: "service" }, "other"))).toBe(false);
  });
});
