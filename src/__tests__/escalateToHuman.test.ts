import { vi, type Mock } from "vitest";

vi.mock("../integrations/bfServerClient", () => ({
  callBFServer: vi.fn(),
}));

vi.mock("../services/staffAvailability", () => ({
  getAvailableStaff: vi.fn(),
}));

import { escalateToHuman } from "../maya/tools/escalateToHuman.js";
import * as bfModule from "../integrations/bfServerClient.js";
import * as staffModule from "../services/staffAvailability.js";

const mockedCallBFServer = bfModule.callBFServer as Mock;
const mockedGetAvailableStaff = staffModule.getAvailableStaff as Mock;

describe("escalateToHuman", () => {
  beforeEach(() => {
    mockedCallBFServer.mockReset();
    mockedGetAvailableStaff.mockReset();
  });

  it("uses available recipients and returns live mode", async () => {
    mockedGetAvailableStaff.mockResolvedValue([{ userId: "1", twilioIdentity: "a" }, { userId: "2", twilioIdentity: null }]);
    mockedCallBFServer.mockResolvedValue({ fanout: { attempted: ["a", "b"], delivered: ["a"] } });

    const result = await escalateToHuman({ summary: "Need human" });

    expect(mockedCallBFServer).toHaveBeenCalledWith(
      "/api/communications/maya-handoff",
      expect.objectContaining({ body: expect.objectContaining({ recipients: "available" }) }),
    );
    expect(result.mode).toBe("live");
    expect(result.ok).toBe(true);
  });

  it("uses fallback recipients and returns after_hours mode", async () => {
    mockedGetAvailableStaff.mockResolvedValue([]);
    mockedCallBFServer.mockResolvedValue({ fanout: { attempted: ["x"], delivered: ["x"] } });

    const result = await escalateToHuman({ summary: "Need human" });

    expect(mockedCallBFServer).toHaveBeenCalledWith(
      "/api/communications/maya-handoff",
      expect.objectContaining({ body: expect.objectContaining({ recipients: "fallback" }) }),
    );
    expect(result.mode).toBe("after_hours");
  });

  it("returns failure while preserving mode when handoff post fails", async () => {
    mockedGetAvailableStaff.mockResolvedValue([]);
    mockedCallBFServer.mockRejectedValue(new Error("boom"));

    const result = await escalateToHuman({ summary: "Need human" });

    expect(result.ok).toBe(false);
    expect(result.mode).toBe("after_hours");
  });
});
