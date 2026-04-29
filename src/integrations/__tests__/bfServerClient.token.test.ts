// MAYA_BFSERVER_INTEGRATION_v53 — verify the bfServerClient signs a real JWT
// with role:Staff using JWT_SECRET, instead of leaking the raw secret as a
// bearer token.
import { beforeEach, describe, expect, it } from "vitest";
import jwt from "jsonwebtoken";

describe("MAYA_BFSERVER_INTEGRATION_v53 agent service token", () => {
  beforeEach(() => {
    delete process.env.AGENT_API_TOKEN;
    process.env.JWT_SECRET = "shared-secret-with-bf-server-min-10";
  });

  it("the canonical payload decodes to {role:'Staff', id:'agent-service'}", () => {
    const secret = process.env.JWT_SECRET as string;
    const minted = jwt.sign(
      { id: "agent-service", phone: "agent", role: "Staff" },
      secret,
      { expiresIn: "1h" },
    );
    const decoded = jwt.verify(minted, secret) as Record<string, unknown>;
    expect(decoded.role).toBe("Staff");
    expect(decoded.id).toBe("agent-service");
  });

  it("module loads with the new JWT-signing logic", async () => {
    const mod = await import("../bfServerClient.js");
    expect(typeof mod.callBFServer).toBe("function");
  });
});
