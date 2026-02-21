import { executeAction } from "../services/actionExecutor";
import { handleBooking } from "../services/bookingEngine";
import { getMayaSettings } from "../services/mayaSettingsService";
import { triggerOutboundCall } from "../services/outboundIntelligence";

jest.mock("../services/bookingEngine", () => ({
  handleBooking: jest.fn()
}));

jest.mock("../services/mayaSettingsService", () => ({
  getMayaSettings: jest.fn()
}));

jest.mock("../services/outboundIntelligence", () => ({
  triggerOutboundCall: jest.fn()
}));

const mockedHandleBooking = handleBooking as jest.MockedFunction<
  typeof handleBooking
>;

const mockedGetMayaSettings = getMayaSettings as jest.MockedFunction<
  typeof getMayaSettings
>;

const mockedTriggerOutboundCall = triggerOutboundCall as jest.MockedFunction<
  typeof triggerOutboundCall
>;

describe("executeAction governance", () => {
  beforeEach(() => {
    mockedHandleBooking.mockReset();
    mockedGetMayaSettings.mockReset();
    mockedTriggerOutboundCall.mockReset();
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 1,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: false,
      high_value_threshold: 500000,
      auto_outbound_enabled: false
    });
  });

  it("blocks all actions at autonomy level 0", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 0,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: false,
      high_value_threshold: 500000,
      auto_outbound_enabled: false
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
      require_confirmation: false,
      high_value_threshold: 500000,
      auto_outbound_enabled: false
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
      require_confirmation: false,
      high_value_threshold: 500000,
      auto_outbound_enabled: false
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
      require_confirmation: true,
      high_value_threshold: 500000,
      auto_outbound_enabled: false
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

  it("skips confirmation for safe booking actions at autonomy level 4", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 4,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: true,
      high_value_threshold: 500000,
      auto_outbound_enabled: false
    });
    mockedHandleBooking.mockResolvedValue({ success: true, message: "Booked" });

    const result = await executeAction(
      { type: "book", requiresConfirmation: true },
      {
        confirmed: false,
        startISO: "2026-03-03T10:00:00Z",
        endISO: "2026-03-03T10:30:00Z"
      }
    );

    expect(result.success).toBe(true);
    expect(mockedHandleBooking).toHaveBeenCalled();
  });

  it("marks high-value transfer for immediate routing at autonomy level 4", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 4,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: false,
      high_value_threshold: 500000,
      auto_outbound_enabled: false
    });

    const result = await executeAction(
      { type: "transfer", requiresConfirmation: false },
      { requestedAmount: 700000 }
    );

    expect(result).toEqual({
      success: true,
      message: "High-value lead detected. Connecting you to a Boreal specialist now."
    });
  });

  it("triggers outbound call for high score when auto outbound is enabled", async () => {
    mockedGetMayaSettings.mockResolvedValue({
      autonomy_level: 4,
      allow_booking: true,
      allow_transfer: true,
      require_confirmation: false,
      high_value_threshold: 500000,
      auto_outbound_enabled: true
    });

    await executeAction(
      { type: "follow_up", requiresConfirmation: false },
      {
        lead: {
          score: 80,
          phone: "+15554443333"
        }
      }
    );

    expect(mockedTriggerOutboundCall).toHaveBeenCalledWith("+15554443333");
  });
});
