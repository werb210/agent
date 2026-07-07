// AGENT_MAYA_CLIENT_IDENTITY_v1 - phone-keyed client application tools must
// receive the authenticated phone the host decoded from the client's bearer
// token, so a signed-in client's "what's my status / how much did I apply for"
// resolves via application.find_mine instead of Maya saying "I can't access
// your details."
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, it, expect } from "vitest";

const dispatch = readFileSync(fileURLToPath(new URL("../dispatch.ts", import.meta.url)), "utf-8");

describe("Maya injects the authenticated phone into client application tools", () => {
  it("has the phone-scoped client tool set including find_mine and my_status", () => {
    expect(dispatch).toContain("AGENT_MAYA_CLIENT_IDENTITY_v1");
    expect(dispatch).toContain("PHONE_SCOPED_CLIENT_TOOLS");
    expect(dispatch).toContain('"application.find_mine"');
    expect(dispatch).toContain('"application.my_status"');
  });
  it("injects ctx.phone (and application_id when known) for those tools", () => {
    expect(dispatch).toContain("phone: (modelArgs.phone as string | undefined) ?? ctx.phone ?? undefined");
    expect(dispatch).toContain("application_id: (modelArgs.application_id as string | undefined) ?? ctx.applicationId ?? undefined");
  });
});
