import { runAgent } from "../src/agents/runAgent";
import { executeTool } from "../src/ai/toolExecutor";
import { withRetry } from "../src/lib/retry";

jest.mock("../src/agents/orchestrator", () => ({
  runMayaAgents: jest.fn().mockResolvedValue({ completed: true })
}));

jest.mock("../src/integrations/bfServerClient", () => ({
  bfServerRequest: jest.fn().mockResolvedValue({ id: "123" })
}));

describe("system integrity", () => {
  beforeEach(() => {
    const globalState = globalThis as typeof globalThis & {
      __TOOL_RUNNING__?: boolean;
      __AGENT_RUNNING__?: boolean;
    };
    globalState.__TOOL_RUNNING__ = false;
    globalState.__AGENT_RUNNING__ = false;
  });

  it("invalid input throws", async () => {
    await expect(runAgent(undefined)).rejects.toThrow("INVALID_AGENT_INPUT");
  });

  it("invalid tool throws", async () => {
    await expect(executeTool("test-call-id", "transferCall", { callSid: "abc" })).rejects.toThrow("INVALID_TOOL: transferCall");
  });

  it("parallel execution throws", async () => {
    const globalState = globalThis as typeof globalThis & { __TOOL_RUNNING__?: boolean };
    globalState.__TOOL_RUNNING__ = true;
    await expect(executeTool("test-call-id", "sendSMS", { phone: "123", message: "hello" })).rejects.toThrow(
      "PARALLEL_TOOL_EXECUTION_BLOCKED"
    );
  });

  it("retry exhaustion throws", async () => {
    await expect(withRetry(async () => Promise.reject(new Error("always fails")))).rejects.toThrow("always fails");
  });

  it("empty tool output throws", async () => {
    const { bfServerRequest } = jest.requireMock("../src/integrations/bfServerClient") as {
      bfServerRequest: jest.Mock;
    };
    bfServerRequest.mockReset();
    bfServerRequest.mockResolvedValueOnce(null);
    await expect(executeTool("test-call-id", "scheduleAppointment", { name: "A", phone: "1" })).rejects.toThrow("EMPTY_TOOL_RESULT");
  });
});
