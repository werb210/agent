// AGENT_APPLICATION_SUMMARY_ROUTE_v436
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
const src = readFileSync(
  path.join(process.cwd(), "src/integrations/bfServerClient.ts"), "utf8");

describe("v436 application status reads a route that returns data", () => {
  it("no longer calls the stub applications route", () => {
    expect(src).not.toContain("`/api/applications/${applicationId}`");
  });

  it("uses the summary route", () => {
    expect(src).toContain("/api/maya/staff/application-summary");
  });

  it("posts the application_id the route requires", () => {
    expect(src).toContain('method: "POST"');
    expect(src).toContain("body: { application_id: applicationId }");
  });

  it("records why, so nobody reverts it to the shorter path", () => {
    expect(src).toContain("is a STUB");
  });
});
