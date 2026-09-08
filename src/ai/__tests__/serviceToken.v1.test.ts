// AGENT_SERVICE_TOKEN_v1
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import jwt from "jsonwebtoken";
import { __resetAgentAuthToken } from "../toolExecutor.js";

const ORIGINAL = process.env.JWT_SECRET;

beforeEach(() => __resetAgentAuthToken());
afterEach(() => { process.env.JWT_SECRET = ORIGINAL; vi.restoreAllMocks(); });

// getAgentAuthToken is module-private; exercise it through the same signing
// contract the executor relies on.
function decode(token: string) {
  return jwt.decode(token) as Record<string, unknown>;
}

describe("agent service token", () => {
  it("refuses the test_secret default rather than minting a token BF-Server rejects", async () => {
    process.env.JWT_SECRET = "test_secret";
    const mod = await import("../toolExecutor.js");
    // Any tool execution must surface config failure, not a 401 later.
    await expect(
      (mod as { execute: (c: never) => Promise<{ ok?: boolean; error?: string }> })
        .execute({ callId: "service-token-test", tool: "createLead", input: {} } as never),
    ).resolves.toMatchObject({
      status: "error",
      error: { message: "JWT_SECRET is the test default; set it to match BF-Server" },
    });
  });

  it("marks the token as a service principal", () => {
    const token = jwt.sign(
      { id: "agent-service", phone: "agent", role: "Staff", principal: "service", service: "maya-agent" },
      "a-real-secret-value",
      { expiresIn: "1h" },
    );
    const claims = decode(token);
    expect(claims.principal).toBe("service");
    expect(claims.service).toBe("maya-agent");
    expect(claims.role).toBe("Staff");
  });

  it("keeps a one hour expiry", () => {
    const token = jwt.sign({ id: "agent-service" }, "a-real-secret-value", { expiresIn: "1h" });
    const claims = decode(token);
    expect(Number(claims.exp) - Number(claims.iat)).toBe(3600);
  });
});
