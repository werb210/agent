import { vi, type Mock } from "vitest";
vi.mock("../services/bookingEngine", () => ({
  handleBooking: vi.fn()
}));

vi.mock("../services/mayaSettingsService", () => ({
  getMayaSettings: vi.fn()
}));

vi.mock("../services/outboundIntelligence", () => ({
  triggerOutboundCall: vi.fn()
}));

import { executeAction } from "../services/actionExecutor.js";
import * as bookingModule from "../services/bookingEngine.js";
import * as settingsModule from "../services/mayaSettingsService.js";
import * as outboundModule from "../services/outboundIntelligence.js";

const mockedHandleBooking = bookingModule.handleBooking as Mock;

const mockedGetMayaSettings = settingsModule.getMayaSettings as Mock;

const mockedTriggerOutboundCall = outboundModule.triggerOutboundCall as Mock;

describe("executeAction governance", () => {
  beforeEach(() => {
    mockedHandleBooking.mockClear();
    mockedGetMayaSettings.mockClear();
    mockedTriggerOutboundCall.mockClear();
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

    await expect(
      executeAction({ type: "follow_up", requiresConfirmation: false }, {})
    ).rejects.toThrow("Action execution is currently disabled.");
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

    await expect(
      executeAction(
        { type: "book", requiresConfirmation: false },
        { startISO: "2026-03-03T10:00:00Z", endISO: "2026-03-03T10:30:00Z" }
      )
    ).rejects.toThrow("Booking is currently disabled.");
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

    await expect(
      executeAction({ type: "transfer", requiresConfirmation: false }, {})
    ).rejects.toThrow("Transfer is currently disabled.");
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

    await expect(
      executeAction({ type: "transfer", requiresConfirmation: true }, { confirmed: false })
    ).rejects.toThrow("Confirmation required.");
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