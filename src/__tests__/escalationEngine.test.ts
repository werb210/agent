import { vi, type Mock } from "vitest";
vi.mock("../services/staffAvailability", () => ({
  getAvailableStaff: vi.fn()
}));

vi.mock("../services/mayaSettingsService", () => ({
  getMayaSettings: vi.fn()
}));

import { evaluateEscalation } from "../services/escalationEngine.js";
import * as staffModule from "../services/staffAvailability.js";
import * as settingsModule from "../services/mayaSettingsService.js";

const mockedGetAvailableStaff =
  staffModule.getAvailableStaff as Mock;

const mockedGetMayaSettings =
  settingsModule.getMayaSettings as Mock;

describe("evaluateEscalation", () => {
  beforeEach(() => {
    mockedGetAvailableStaff.mockClear();
    mockedGetMayaSettings.mockClear();
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 2,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: true
    });
  });

  it("returns no escalation when escalated flag is false", async () => {
    const result = await evaluateEscalation(false);

    expect(result).toEqual({
      shouldEscalate: false,
      fallbackBooking: false
    });
    expect(mockedGetAvailableStaff).not.toHaveBeenCalled();
    expect(mockedGetMayaSettings).not.toHaveBeenCalled();
  });

  it("returns fallback booking when autonomy level is below transfer threshold", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 1,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: true
    });

    const result = await evaluateEscalation(true);

    expect(result).toEqual({
      shouldEscalate: true,
      fallbackBooking: true
    });
    expect(mockedGetAvailableStaff).not.toHaveBeenCalled();
  });

  it("routes transfer when escalation is needed and staff is available", async () => {
    mockedGetAvailableStaff.mockResolvedValue(["staff123", "staff456"]);

    const result = await evaluateEscalation(true);

    expect(result).toEqual({
      shouldEscalate: true,
      transferTo: "staff123",
      fallbackBooking: false
    });
  });

  it("returns fallback booking when escalation is needed and no staff is available", async () => {
    mockedGetAvailableStaff.mockResolvedValue([]);

    const result = await evaluateEscalation(true);

    expect(result).toEqual({
      shouldEscalate: true,
      fallbackBooking: true
    });
  });
});