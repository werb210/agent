import { evaluateEscalation } from "../services/escalationEngine";
import { getAvailableStaff } from "../services/staffAvailability";

jest.mock("../services/staffAvailability", () => ({
  getAvailableStaff: jest.fn()
}));

const mockedGetAvailableStaff = getAvailableStaff as jest.MockedFunction<
  typeof getAvailableStaff
>;

describe("evaluateEscalation", () => {
  beforeEach(() => {
    mockedGetAvailableStaff.mockReset();
  });

  it("returns no escalation when escalated flag is false", async () => {
    const result = await evaluateEscalation(false);

    expect(result).toEqual({
      shouldEscalate: false,
      fallbackBooking: false
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
