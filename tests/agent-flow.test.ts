import { assertApiResponse } from "../src/lib/assertApiResponse";
import { executeTool } from "../src/ai/toolExecutor";

jest.mock("../src/agents/orchestrator", () => ({
  runMayaAgents: jest.fn()
}));

jest.mock("../src/integrations/bfServerClient", () => ({
  bfServerRequest: jest.fn()
}));

const { runMayaAgents } = jest.requireMock("../src/agents/orchestrator") as {
  runMayaAgents: jest.Mock;
};

const { bfServerRequest } = jest.requireMock("../src/integrations/bfServerClient") as {
  bfServerRequest: jest.Mock;
};

describe("agent deterministic flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("valid input returns valid output", async () => {
    const expected = { sales: {}, marketing: {}, risk: {} };
    runMayaAgents.mockResolvedValue(expected);

    const { runAgent } = await import("../src/agents/runAgent");
    await expect(runAgent({ leadId: "123" })).resolves.toEqual(expected);
  });

  it("invalid input throws", async () => {
    const { runAgent } = await import("../src/agents/runAgent");
    await expect(runAgent(undefined)).rejects.toThrow("Missing input");
  });

  it("tool failure bubbles up as explicit failure payload", async () => {
    bfServerRequest.mockRejectedValue(new Error("tool failed"));

    await expect(executeTool("scheduleAppointment", { name: "Test", phone: "123" })).resolves.toEqual({
      success: false,
      error: "tool failed"
    });
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
