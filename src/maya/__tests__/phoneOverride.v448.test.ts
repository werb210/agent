// AGENT_PHONE_OVERRIDE_v448
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
const src = readFileSync(
  path.join(process.cwd(), "src/maya/dispatch.ts"),
  "utf8",
);
const branchStart = src.indexOf("AGENT_PHONE_OVERRIDE_v448");
const branchEnd = src.indexOf(
  "// AGENT_BLOCK_v328_MAYA_FAILSAFE_v1",
  branchStart,
);
const branch = src.slice(branchStart, branchEnd);

describe("v448 the host's phone wins over the model's", () => {
  it("no longer uses ?? for the phone", () => {
    expect(branch).not.toContain("?? ctx.phone");
  });

  it("treats an empty string as absent, not as a value", () => {
    expect(branch).toContain('v.trim() === ""');
  });

  it("prefers the host value when it has one", () => {
    expect(branch).toContain("!blank(fromHost) ? fromHost");
  });

  it("still falls back to the model when the host has nothing", () => {
    expect(branch).toContain("!blank(fromModel)");
  });

  it("applies the same rule to session_id and application_id", () => {
    expect(branch).toContain("pick(modelArgs.session_id, ctx.sessionId)");
    expect(branch).toContain(
      "pick(modelArgs.application_id, ctx.applicationId)",
    );
  });
});
