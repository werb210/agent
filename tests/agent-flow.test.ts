import { assertApiResponse } from "../src/lib/assertApiResponse";

jest.mock("../src/tools", () => ({
  createLead: jest.fn(),
  startCall: jest.fn(),
  updateCallStatus: jest.fn()
}));

const { startCall } = jest.requireMock("../src/tools") as {
  startCall: jest.Mock;
};

describe("agent deterministic flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("valid input returns valid output", async () => {
    startCall.mockResolvedValue({ scheduled: true });
    const { runAgent } = await import("../src/agents/runAgent");
    const response = await runAgent({
      callId: "test-call-id-1",
      tool: "startCall",
      input: { to: "+15555550123", token: "token" }
    });

    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("meta.callId");
    expect(response.status).toBe("ok");
  });

  it("invalid input throws", async () => {
    const { runAgent } = await import("../src/agents/runAgent");
    await expect(runAgent(undefined as never)).rejects.toThrow("INVALID_CALL_INPUT");
  });

  it("tool failure returns error response", async () => {
    startCall.mockRejectedValue(new Error("tool failed"));
    const { runAgent } = await import("../src/agents/runAgent");

    const response = await runAgent({
      callId: "test-call-id-2",
      tool: "startCall",
      input: { to: "+15555550123", token: "token" }
    });

    expect(response).toHaveProperty("status");
    expect(response).toHaveProperty("meta.callId");
    expect(response.status).toBe("error");
  });

  it("API failure bubbles up", () => {
    expect(() =>
      assertApiResponse({
        success: false,
        error: "Request failed upstream"
      })
    ).toThrow("Request failed upstream");
  });
});
