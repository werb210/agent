import { executeAction } from "../services/actionExecutor";
import { handleBooking } from "../services/bookingEngine";
import { getMayaSettings } from "../services/mayaSettingsService";

jest.mock("../services/bookingEngine", () => ({
  handleBooking: jest.fn()
}));

jest.mock("../services/mayaSettingsService", () => ({
  getMayaSettings: jest.fn()
}));

const mockedHandleBooking = handleBooking as jest.MockedFunction<
  typeof handleBooking
>;

const mockedGetMayaSettings = getMayaSettings as jest.MockedFunction<
  typeof getMayaSettings
>;

describe("executeAction governance", () => {
  beforeEach(() => {
    mockedHandleBooking.mockReset();
    mockedGetMayaSettings.mockReset();
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 1,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: false
    });
  });

  it("blocks all actions at autonomy level 0", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 0,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: false
    });

    const result = await executeAction(
      { type: "follow_up", requiresConfirmation: false },
      {}
    );

    expect(result).toEqual({
      success: false,
      message: "Action execution is currently disabled."
    });
  });

  it("blocks booking when disabled", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 2,
      allow_booking: false,
      allow_transfer: true,
      require_confirmation: false
    });

    const result = await executeAction(
      { type: "book", requiresConfirmation: false },
      { startISO: "2026-03-03T10:00:00Z", endISO: "2026-03-03T10:30:00Z" }
    );

    expect(result).toEqual({
      success: false,
      message: "Booking is currently disabled."
    });
    expect(mockedHandleBooking).not.toHaveBeenCalled();
  });

  it("blocks transfer when disabled", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 2,
      allow_booking: true,
      allow_transfer: false,
      require_confirmation: false
    });

    const result = await executeAction(
      { type: "transfer", requiresConfirmation: false },
      {}
    );

    expect(result).toEqual({
      success: false,
      message: "Transfer is currently disabled."
    });
  });

  it("requires confirmation when configured", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 2,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: true
    });

    const result = await executeAction(
      { type: "transfer", requiresConfirmation: true },
      { confirmed: false }
    );

    expect(result).toEqual({
      success: false,
      message: "Confirmation required."
    });
  });

  it("executes booking when governance checks pass", async () => {
    mockedHandleBooking.mockResolvedValue({
      success: true,
      message: "Booked"
    });

    const result = await executeAction(
      { type: "book", requiresConfirmation: false },
      {
        startISO: "2026-03-03T10:00:00Z",
        endISO: "2026-03-03T10:30:00Z",
        phone: "+1234567890"
      }
    );

    expect(result).toEqual({
      success: true,
      message: "Booked"
    });
    expect(mockedHandleBooking).toHaveBeenCalledWith({
      startISO: "2026-03-03T10:00:00Z",
      endISO: "2026-03-03T10:30:00Z",
      phone: "+1234567890"
    });
  });
});
