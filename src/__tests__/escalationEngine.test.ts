import { evaluateEscalation } from "../services/escalationEngine";
import { getAvailableStaff } from "../services/staffAvailability";
import { getMayaSettings } from "../services/mayaSettingsService";

jest.mock("../services/staffAvailability", () => ({
  getAvailableStaff: jest.fn()
}));

jest.mock("../services/mayaSettingsService", () => ({
  getMayaSettings: jest.fn()
}));

const mockedGetAvailableStaff = getAvailableStaff as jest.MockedFunction<
  typeof getAvailableStaff
>;

const mockedGetMayaSettings = getMayaSettings as jest.MockedFunction<
  typeof getMayaSettings
>;

describe("evaluateEscalation", () => {
  beforeEach(() => {
    mockedGetAvailableStaff.mockReset();
    mockedGetMayaSettings.mockReset();
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
