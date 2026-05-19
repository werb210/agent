import { vi, type Mock } from "vitest";

vi.mock("../integrations/bfServerClient", () => ({
  callBFServer: vi.fn(),
}));

import { visitorIdentify } from "../maya/tools/visitorIdentify.js";
import * as bfModule from "../integrations/bfServerClient.js";

const mockedCallBFServer = bfModule.callBFServer as Mock;

describe("visitorIdentify", () => {
  beforeEach(() => {
    mockedCallBFServer.mockReset();
  });

  it("returns error when name is missing", async () => {
    const result = await visitorIdentify({ email: "a@b.com" });
    expect(result.ok).toBe(false);
    expect(result.summary.toLowerCase()).toContain("name");
  });

  it("returns error when name exists but email/phone are missing", async () => {
    const result = await visitorIdentify({ name: "Jane" });
    expect(result.ok).toBe(false);
    expect(result.summary.toLowerCase()).toContain("email");
  });

  it("returns error for malformed email", async () => {
    const result = await visitorIdentify({ name: "Jane", email: "nope" });
    expect(result.ok).toBe(false);
    expect(result.summary.toLowerCase()).toContain("email");
  });

  it("posts waitlist payload and succeeds with valid name+email", async () => {
    mockedCallBFServer.mockResolvedValue({ ok: true });

    const result = await visitorIdentify({ name: "Jane Doe", email: "jane@example.com" });

    expect(mockedCallBFServer).toHaveBeenCalledWith("/api/crm/startup-waitlist", {
      method: "POST",
      body: expect.objectContaining({
        source: "maya_visitor_intake",
        name: "Jane Doe",
        email: "jane@example.com",
      }),
    });
    expect(result.ok).toBe(true);
  });
});
