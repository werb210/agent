// AGENT_APPLICATION_SUMMARY_ROUTE_v436
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
const src = readFileSync(
  path.join(process.cwd(), "src/integrations/bfServerClient.ts"), "utf8");

describe("v436 client tools call a route the service token covers", () => {
  it("no longer calls the staff applications route", () => {
    expect(src).not.toContain("`/api/applications/${applicationId}`");
  });

  it("uses the maya-prefixed summary route", () => {
    expect(src).toContain("/api/maya/staff/application-summary");
  });

  it("posts the application_id the route requires", () => {
    expect(src).toContain('method: "POST"');
    expect(src).toContain("body: { application_id: applicationId }");
  });

  it("keeps the application-status call under /api/maya/", () => {
    const helper = src.match(
      /export async function fetchApplicationStatus[\s\S]*?\n}/,
    )?.[0];

    expect(helper).toBeDefined();
    expect(helper).toContain('callBFServer<any>("/api/maya/');
  });
});
