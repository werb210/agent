// AGENT_APPLICATION_SUMMARY_ROUTE_v436 - GET /api/applications/:id is a stub on BF-Server, so
// application status reads the summary route. Checked on the request actually sent.
import { afterEach, describe, expect, it } from "vitest";
import { fetchApplicationStatus } from "../bfServerClient.js";
import { createBfServerFake } from "../../../test/bfServerFake.js";
import { APPLICATION_SUMMARY } from "../../../test/fixtures/bfServer.v789.js";

const realFetch = globalThis.fetch;
afterEach(() => { globalThis.fetch = realFetch; });

describe("v436 application status reads a route that returns data", () => {
  it("POSTs the application_id to the summary route and returns its data", async () => {
    const fake = createBfServerFake();
    globalThis.fetch = fake.fetch;
    const r = await fetchApplicationStatus("app-1");
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]).toMatchObject({ path: "/api/maya/staff/application-summary", method: "POST", body: { application_id: "app-1" } });
    expect(r.pipeline_state).toBe(APPLICATION_SUMMARY.pipeline_state);
  });
});
