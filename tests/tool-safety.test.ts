import { execute } from "../src/ai/toolExecutor";

jest.mock("../src/tools", () => ({
  createLead: jest.fn(),
  startCall: jest.fn(),
  updateCallStatus: jest.fn()
}));

const { startCall } = jest.requireMock("../src/tools") as {
  startCall: jest.Mock;
};

describe("tool safety boundaries", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("times out long-running tools", async () => {
    jest.useFakeTimers();
    startCall.mockImplementation(() => new Promise(() => undefined));

    const pending = execute({
      callId: "tool-timeout-1",
      tool: "startCall",
      input: { to: "+15555550123", token: "token" }
    });

    await jest.advanceTimersByTimeAsync(10_000);
    await expect(pending).resolves.toMatchObject({
      status: "error",
      error: { code: "TOOL_TIMEOUT" }
    });

    jest.useRealTimers();
  });

  it("rejects unknown tools that are not allow-listed", async () => {
    const result = await execute({
      callId: "tool-not-allowed-1",
      tool: "deleteEverything",
      input: {}
    });

    expect(result).toMatchObject({
      status: "error",
      error: { code: "TOOL_NOT_ALLOWED", message: "deleteEverything" }
    });
  });
});
