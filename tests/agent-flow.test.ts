import { assertApiResponse } from "../src/lib/assertApiResponse";
import { executeTool } from "../src/ai/toolExecutor";

jest.mock("../src/agents/orchestrator", () => ({
  runMayaAgents: jest.fn()
}));

jest.mock("../src/tools", () => ({
  createLead: jest.fn(),
  startCall: jest.fn(),
  updateCallStatus: jest.fn()
}));

const { runMayaAgents } = jest.requireMock("../src/agents/orchestrator") as {
  runMayaAgents: jest.Mock;
};

const { startCall } = jest.requireMock("../src/tools") as {
  startCall: jest.Mock;
};


jest.mock("../src/lib/toolExecutor", () => ({
  executeTool: jest.fn(async (_callId: string, _name: string, _params: Record<string, unknown>, fn: () => Promise<unknown>) => fn())
}));
describe("agent deterministic flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("valid input returns valid output", async () => {
    const expected = { sales: {}, marketing: {}, risk: {} };
    runMayaAgents.mockResolvedValue(expected);

    const { runAgent } = await import("../src/agents/runAgent");
    await expect(runAgent({ intent: "qualifyLead", leadId: "123" })).resolves.toEqual({ success: true, result: expected });
  });

  it("invalid input throws", async () => {
    const { runAgent } = await import("../src/agents/runAgent");
    await expect(runAgent(undefined)).rejects.toThrow("INVALID_AGENT_INPUT");
  });

  it("tool failure throws and bubbles up", async () => {
    startCall.mockRejectedValue(new Error("tool failed"));

    await expect(executeTool("test-call-id", "startCall", { to: "+15555550123" }, "token")).rejects.toThrow("tool failed");
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
