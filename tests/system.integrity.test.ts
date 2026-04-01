import { runAgent } from "../src/agents/runAgent";
import { executeTool } from "../src/ai/toolExecutor";
import { withRetry } from "../src/lib/retry";

jest.mock("../src/agents/orchestrator", () => ({
  runMayaAgents: jest.fn().mockResolvedValue({ completed: true })
}));

jest.mock("../src/tools", () => ({
  createLead: jest.fn().mockResolvedValue({ id: "123" }),
  startCall: jest.fn().mockResolvedValue({ callId: "call-1" }),
  updateCallStatus: jest.fn().mockResolvedValue({ updated: true })
}));


jest.mock("../src/lib/toolExecutor", () => ({
  executeTool: jest.fn(async (_callId: string, _name: string, _params: Record<string, unknown>, fn: () => Promise<unknown>) => fn())
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
    await expect(executeTool("test-call-id", "transferCall", { callSid: "abc" }, "token")).rejects.toThrow("INVALID_TOOL: transferCall");
  });

  it("parallel execution throws", async () => {
    const globalState = globalThis as typeof globalThis & { __TOOL_RUNNING__?: boolean };
    globalState.__TOOL_RUNNING__ = true;
    await expect(executeTool("test-call-id", "startCall", { to: "+15555550123" }, "token")).rejects.toThrow(
      "PARALLEL_TOOL_EXECUTION_BLOCKED"
    );
  });

  it("retry exhaustion throws", async () => {
    await expect(withRetry(async () => Promise.reject(new Error("always fails")))).rejects.toThrow("always fails");
  });
});
